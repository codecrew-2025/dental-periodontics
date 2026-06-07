import express from 'express';
import mongoose from 'mongoose';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';

// Import models
import PedodonticsCase from '../models/PedodonticsCase.js';
import OralCase from '../models/Oral-model.js';
import PeriodonticsCaseModel from '../models/PeriodonticsCaseModel.js';

const router = express.Router();

const normalizeRole = (value) => String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
const normalizeDepartment = (value) => String(value || '').trim().toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '');

const doctorDepartmentCaseScope = {
  pedodontics: ['pedodontics'],
  oral: ['oral'],
  general: ['oral'],
  generaldentistry: ['oral'],
  oralandmaxillofacial: ['oral'],
  oralmaxillofacial: ['oral'],
  oralandmaxillofacialsurgery: ['oral'],
  oralmaxillofacialsurgery: ['oral'],
  oralmedicine: ['oral'],
  oralmedicineandradiology: ['oral'],
  oralmedicineradiology: ['oral'],
  periodontics: ['periodontics'],
  periodontology: ['periodontics'],
};

const canDoctorAccessDepartment = (user, caseDepartmentKey) => {
  if (normalizeRole(user?.role) !== 'doctor') return true;
  const dept = normalizeDepartment(user?.department);
  const allowed = doctorDepartmentCaseScope[dept] || [];
  return allowed.includes(caseDepartmentKey);
};

const isRedoOrResendApproval = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return false;
  return raw.startsWith('redo') || raw.startsWith('resend') || raw.startsWith('rejected');
};

const applySafeUpdates = (targetDoc, updates) => {
  const reservedKeys = new Set([
    '_id',
    'id',
    '__v',
    'doctorId',
    'doctorName',
    'patientId',
    'patientName',
    'createdAt',
    'createdBy',
    'approvedBy',
    'approvedAt',
    'chiefApproval',
    'updatedAt',
  ]);

  Object.entries(updates || {}).forEach(([key, val]) => {
    if (reservedKeys.has(key)) return;
    if (val === undefined) return;
    targetDoc[key] = val;
  });
};

/**
 * Normalise oral medicine payload — mirrors the logic in oral-route.js so that
 * redo-edits submitted via the unified PUT endpoint pass Mongoose validation.
 */
const normaliseOralPayload = (body) => {
  const b = { ...body };

  // sex → gender (required enum in OralCase model)
  if (!b.gender && b.sex) b.gender = b.sex;

  // Short review-of-systems aliases → canonical names
  if (b.cns)              b.centralNervousSystem       = b.cns;
  if (b.cvs)              b.cardioVascularSystem        = b.cvs;
  if (b.respiratory)      b.respiratorySystem           = b.respiratory;
  if (b.gastrointestinal) b.gastroIntestinalSystem      = b.gastrointestinal;
  if (b.genitoUrinary)    b.genitoUrinarySystem         = b.genitoUrinary;
  if (b.skeletal)         b.skeletalSystem              = b.skeletal;

  // missingTeeth → missing
  if (b.missingTeeth)     b.missing = b.missingTeeth;

  // Mirror investigation checkboxes into legacy free-text fields
  const invMap = [
    ['invHematological',    'invHematologicalNotes',     'hematological'],
    ['invUrine',            'invUrineNotes',              'urine'],
    ['invBiochemical',      'invBiochemicalNotes',        'bioChemical'],
    ['invSerological',      'invSerologicalNotes',        'serological'],
    ['invCytological',      'invCytologicalNotes',        'cytological'],
    ['invMicrobiological',  'invMicrobiologicalNotes',    'microbiological'],
    ['invSpecial',          'invSpecialNotes',            'specialInvestigations'],
    ['invRadiological',     'invRadiologicalNotes',       'radiological'],
    ['invBiopsy',           'invBiopsyNotes',             'biopsy'],
    ['invHistopathological','invHistopathologicalNotes',  'histopathologicalExamination'],
    ['invOthers',           'invOthersNotes',             'otherInvestigations'],
  ];
  invMap.forEach(([boolKey, notesKey, legacyKey]) => {
    if (b[boolKey]) b[legacyKey] = b[notesKey] || 'Yes';
  });

  // Ensure age is a number
  if (b.age !== undefined) b.age = Number(b.age) || 0;

  return b;
};

/**
 * Normalise Periodontics payload - parses base64 digitalSignature into Buffer.
 */
const normalisePeriodonticsPayload = (body) => {
  const b = { ...body };
  if (b.digitalSignature) {
    if (typeof b.digitalSignature === 'string') {
      if (b.digitalSignature.startsWith('data:image')) {
        const matches = b.digitalSignature.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          b.digitalSignature = {
            data: Buffer.from(matches[2], 'base64'),
            contentType: matches[1],
            fileName: 'signature.png'
          };
        }
      } else if (b.digitalSignature.length > 50) {
        b.digitalSignature = {
          data: Buffer.from(b.digitalSignature, 'base64'),
          contentType: 'image/png',
          fileName: 'signature.png'
        };
      }
    }
  }
  return b;
};

// GET /api/casesheets/pg/history
// GET /api/casesheets/pg/history
// Returns completed case sheets created by the logged-in PG/UG across departments
router.get('/pg/history', auth, requireRole(['pg', 'ug']), async (req, res) => {
  try {
    const pgIdentity = String(req.user?.Identity || '').trim();
    if (!pgIdentity) {
      return res.status(400).json({ success: false, message: 'PG/UG identity missing' });
    }

    const projections = {
      patientId: 1,
      patientName: 1,
      doctorId: 1,
      doctorName: 1,
      chiefApproval: 1,
      approvedBy: 1,
      approvedAt: 1,
      createdAt: 1,
      updatedAt: 1,
      referredDepartment: 1,
    };

    const sources = [
      { model: PedodonticsCase, department: 'Pedodontics', departmentKey: 'pedodontics' },
      { model: OralCase, department: 'Oral', departmentKey: 'oral' },
      { model: PeriodonticsCaseModel, department: 'Periodontics', departmentKey: 'periodontics' },
    ];

    const results = await Promise.all(
      sources.map(async ({ model, department, departmentKey, query }) => {
        try {
          const rows = await model
            .find(query || { doctorId: pgIdentity }, projections)
            .sort({ createdAt: -1 })
            .lean();

          return (Array.isArray(rows) ? rows : []).map((row) => ({
            caseId: String(row?._id || ''),
            department,
            departmentKey,
            patientId: String(row?.patientId || '').trim(),
            patientName: String(row?.patientName || '').trim(),
            doctorId: String(row?.doctorId || '').trim(),
            doctorName: String(row?.doctorName || '').trim(),
            chiefApproval: String(row?.chiefApproval || ''),
            approvedBy: String(row?.approvedBy || ''),
            approvedAt: row?.approvedAt || null,
            createdAt: row?.createdAt || null,
            updatedAt: row?.updatedAt || null,
            referredDepartment: String(row?.referredDepartment || ''),
          }));
        } catch (error) {
          console.error(`Error fetching PG history for ${departmentKey}:`, error);
          return [];
        }
      })
    );

    const merged = results.flat().filter((row) => row.caseId);
    merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.json({ success: true, data: merged });
  } catch (error) {
    console.error('Error fetching PG casesheet history:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/casesheets/periodontics/save
// Save a Periodontics case sheet
router.post('/periodontics/save', auth, requireRole(['doctor', 'chief', 'pg', 'ug']), async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      diagnosis,
      treatment,
      treatmentPlan,
      finalDiagnosis,
      doctorId: bodyDoctorId,
      doctorName: bodyDoctorName,
      digitalSignature,
      caseType,
      ...otherFields
    } = req.body;

    const authenticatedDoctorId = String(req.user?.Identity || '').trim();
    const authenticatedDoctorName = String(req.user?.name || req.user?.Name || '').trim();
    const doctorId = String(bodyDoctorId || authenticatedDoctorId || '').trim();
    const doctorName = String(bodyDoctorName || authenticatedDoctorName || '').trim();

    if (!patientId || !patientName || !doctorId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Process digital signature if provided as base64
    let processedSignature = null;
    if (digitalSignature) {
      if (typeof digitalSignature === 'string') {
        if (digitalSignature.startsWith('data:image')) {
          const matches = digitalSignature.match(/^data:([^;]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            processedSignature = {
              data: Buffer.from(matches[2], 'base64'),
              contentType: matches[1],
              fileName: 'signature.png'
            };
          }
        } else if (digitalSignature.length > 50) {
          processedSignature = {
            data: Buffer.from(digitalSignature, 'base64'),
            contentType: 'image/png',
            fileName: 'signature.png'
          };
        }
      } else if (digitalSignature.data && digitalSignature.contentType) {
        processedSignature = digitalSignature;
      }
    }

    const caseDoc = new PeriodonticsCaseModel({
      patientId: String(patientId).trim(),
      patientName: String(patientName).trim(),
      doctorId,
      doctorName,
      diagnosis: String(diagnosis || '').trim(),
      treatment: String(treatment || '').trim(),
      treatmentPlan: String(treatmentPlan || '').trim(),
      finalDiagnosis: String(finalDiagnosis || '').trim(),
      chiefApproval: 'pending',
      digitalSignature: processedSignature,
      caseType: caseType || 'short',
      ...otherFields,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await caseDoc.save();
    return res.json({ success: true, data: caseDoc, message: 'Periodontics case saved successfully' });
  } catch (error) {
    console.error('Error saving Periodontics case:', error);
    return res.status(500).json({ success: false, message: 'Failed to save case' });
  }
});

// GET /api/casesheets/periodontics/chief/all-cases
// Returns all Periodontics cases for chief doctor review
router.get('/periodontics/chief/all-cases', auth, requireRole(['doctor', 'chief', 'chief_doctor']), async (req, res) => {
  try {
    const cases = await PeriodonticsCaseModel.find({})
      .select('-digitalSignature')
      .sort({ createdAt: -1 })
      .lean();

    const data = cases.map((c) => ({
      ...c,
      _id: String(c._id || ''),
      patientId: String(c.patientId || '').trim(),
      patientName: String(c.patientName || '').trim(),
      doctorId: String(c.doctorId || '').trim(),
      doctorName: String(c.doctorName || '').trim(),
      chiefApproval: String(c.chiefApproval || ''),
      approvedBy: String(c.approvedBy || ''),
      approvedAt: c.approvedAt || null,
      createdAt: c.createdAt || null,
      updatedAt: c.updatedAt || null,
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching periodontics chief all-cases:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching cases' });
  }
});

// GET /api/casesheets/:caseId
// Searches known case collections for the given ID and returns the case and department
router.get('/:caseId', auth, async (req, res) => {
  try {
    const { caseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ success: false, message: 'Invalid case id' });
    }

    // Try pedodontics
    let doc = await PedodonticsCase.findById(caseId);
    if (doc) {
      return res.json({ success: true, data: doc, department: 'pedodontics' });
    }

    // Try periodontics
    doc = await PeriodonticsCaseModel.findById(caseId);
    if (doc) {
      return res.json({ success: true, data: doc, department: 'periodontics' });
    }

    // Try oral medicine
    doc = await OralCase.findById(caseId);
    if (doc) {
      return res.json({ success: true, data: doc, department: 'oral' });
    }

    return res.status(404).json({ success: false, message: 'Case not found' });
  } catch (error) {
    console.error('Error searching casesheets:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/casesheets/:caseId
// Allows a PG/UG to update a case sheet ONLY when it is marked as redo/resend.
// The case must belong to that PG/UG (stored in doctorId), and after update the approval is reset.
router.put('/:caseId', auth, requireRole(['pg', 'ug']), async (req, res) => {
  try {
    const { caseId } = req.params;
    const pgIdentity = String(req.user?.Identity || '').trim();

    if (!pgIdentity) {
      return res.status(400).json({ success: false, message: 'PG/UG identity missing' });
    }

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ success: false, message: 'Invalid case id' });
    }

    const sources = [
      { model: PedodonticsCase, departmentKey: 'pedodontics' },
      { model: OralCase, departmentKey: 'oral' },
      { model: PeriodonticsCaseModel, departmentKey: 'periodontics' },
    ];

    let found = null;
    for (const source of sources) {
      const doc = await source.model.findById(caseId);
      if (doc) {
        found = { doc, departmentKey: source.departmentKey };
        break;
      }
    }

    if (!found?.doc) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const caseDoc = found.doc;

    // PG can only edit their own cases
    if (String(caseDoc.doctorId || '').trim() !== pgIdentity) {
      return res.status(403).json({ success: false, message: 'You can only edit your own case sheets' });
    }

    // Only allow editing when doctor requested redo/resend
    if (!isRedoOrResendApproval(caseDoc.chiefApproval)) {
      return res.status(400).json({
        success: false,
        message: 'This case is not marked for redo. Editing is allowed only for redo cases.',
      });
    }

    let updates = req.body;
    if (found.departmentKey === 'oral') {
      updates = normaliseOralPayload(req.body);
    } else if (found.departmentKey === 'periodontics') {
      updates = normalisePeriodonticsPayload(req.body);
    }
    applySafeUpdates(caseDoc, updates);

    // Reset approval status after resubmission
    caseDoc.chiefApproval = '';
    caseDoc.approvedBy = '';
    caseDoc.approvedAt = null;
    caseDoc.updatedAt = new Date();

    await caseDoc.save();

    return res.json({
      success: true,
      message: 'Case sheet updated and resubmitted successfully.',
      data: caseDoc,
      department: found.departmentKey,
    });
  } catch (error) {
    console.error('Error updating casesheet (PG/UG redo edit):', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── Startup Database Migration for Legacy Periodontics Cases ──────────────────
const runPeriodonticsMigration = async () => {
  try {
    const LONG_CASE_FIELDS = [
      'facial_symmetry', 'case_report', 'invest_radiographs',
      'provisional_diagnosis', 'differential_diagnosis',
      'biopsy_examination', 'microbiological_examination',
      'risk_predictors_markers', 'ohi_s_total',
      'tmj_examination', 'mouth_opening', 'lymph_node_examination',
      'lip_competence', 'lesions', 'halitosis',
      'buccal_mucosa', 'labial_mucosa', 'tongue', 'palate',
      'floor_of_mouth', 'vestibule', 'tonsils', 'case_summary',
      'prognosis', 'treatmentDone'
    ];
    
    const cases = await PeriodonticsCaseModel.find({ caseType: { $exists: false } });
    if (cases.length > 0) {
      console.log(`[Migration] Found ${cases.length} periodontics cases without caseType. Upgrading...`);
      let updatedCount = 0;
      for (const c of cases) {
        const isLong = LONG_CASE_FIELDS.some(f => c[f] !== undefined && c[f] !== null);
        const targetType = isLong ? 'long' : 'short';
        await PeriodonticsCaseModel.updateOne({ _id: c._id }, { $set: { caseType: targetType } });
        updatedCount++;
      }
      console.log(`[Migration] Successfully migrated ${updatedCount} periodontics cases.`);
    }
  } catch (err) {
    console.error('[Migration] Error running periodontics migration:', err);
  }
};

if (mongoose.connection.readyState === 1) {
  runPeriodonticsMigration();
} else {
  mongoose.connection.once('connected', runPeriodonticsMigration);
}

export default router;
