import express from 'express';
import OralCase from '../models/Oral-model.js';
import Appointment from '../models/AppoitmentBooked.js';
import { User } from '../models/User.js';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';

const router = express.Router();

// ── Helper: normalize a department label to a canonical lowercase key ────────
const normalizeDept = (d) =>
  String(d || '').trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');

// Get all alias keys for a given department label (mirrors appointment.js)
const getDeptAliases = (label) => {
  const n = normalizeDept(label);
  if (n.startsWith('prostho') || n.startsWith('protho') || n.startsWith('prosthon'))
    return ['prosthodontics', 'prothodontics', 'prosthondontics'];
  if (n === 'pedodontics') return ['pedodontics'];
  if (n === 'periodontics' || n === 'periodontology') return ['periodontics', 'periodontology'];
  if (n.includes('conservative') || n.includes('endodontic')) return ['conservativedentistryandendodontics', 'conservativedentistry', 'endodontics'];
  return [n];
};

/**
 * When an Oral Medicine case sheet refers a patient to a specialist department,
 * update the patient's upcoming appointment so that the specialist doctor's
 * identifiers are on it.  This makes the appointment visible in the specialist
 * doctor's "My Appointments" / "All Appointments" views.
// Escape user input for use in RegExp
const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Normalise the raw request body from OralMedicine.jsx into the exact
 * field names the Mongoose model expects.
 *
 * The form sends short aliases (cns, cvs, missingTeeth, sex …) while the
 * model also accepts the canonical names.  We store BOTH so old and new
 * documents are always readable.
 */
const normalisePayload = (body) => {
  const b = { ...body };

  // sex → gender (required enum)
  if (!b.gender && b.sex) b.gender = b.sex;

  // Short review-of-systems aliases → canonical names (stored in both)
  if (b.cns)              b.centralNervousSystem      = b.cns;
  if (b.cvs)              b.cardioVascularSystem       = b.cvs;
  if (b.respiratory)      b.respiratorySystem          = b.respiratory;
  if (b.gastrointestinal) b.gastroIntestinalSystem     = b.gastrointestinal;
  if (b.genitoUrinary)    b.genitoUrinarySystem        = b.genitoUrinary;
  if (b.skeletal)         b.skeletalSystem             = b.skeletal;

  // missingTeeth → missing (stored in both)
  if (b.missingTeeth)     b.missing = b.missingTeeth;

  // Flatten investigation checkboxes into legacy free-text fields so the
  // OralMedicineView can display them regardless of which format was saved.
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
    if (b[boolKey]) {
      // If checked and has notes, mirror into legacy field
      b[legacyKey] = b[notesKey] || 'Yes';
    }
  });

  // Ensure age is a number
  if (b.age !== undefined) b.age = Number(b.age) || 0;

  return b;
};

// ── CREATE ────────────────────────────────────────────────────────────────
router.post('/', auth, requireRole(['doctor', 'chief', 'pg', 'ug']), async (req, res) => {
  try {
    const payload = normalisePayload(req.body);
    
    // Debug: Log if signature is in the payload
    if (payload.digitalSignature) {
      console.log(`[ORAL-API] POST - Received digitalSignature, length: ${payload.digitalSignature.length}`);
    } else {
      console.log(`[ORAL-API] POST - NO digitalSignature in payload`);
    }
    
    const oralCase = new OralCase(payload);
    await oralCase.save();
    
    // Debug: Log if signature was saved
    const savedSig = oralCase.digitalSignature;
    if (savedSig) {
      console.log(`[ORAL-API] POST - Saved case with digitalSignature, length: ${savedSig.length}`);
    } else {
      console.log(`[ORAL-API] POST - Saved case WITHOUT digitalSignature`);
    }

    // The frontend also calls /api/general/save to handle referral logic & PG assignments

    res.status(201).json({
      success: true,
      message: 'Oral case created successfully',
      data: oralCase,
      caseId: oralCase._id,
    });
  } catch (error) {
    console.error('Error creating oral case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create oral case',
      error: error.message,
    });
  }
});

// ── GET ALL FOR DOCTOR ────────────────────────────────────────────────────
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const cases = await OralCase.find({ doctorId: req.params.doctorId })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: cases });
  } catch (error) {
    console.error('Error fetching oral cases:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch oral cases', error: error.message });
  }
});

// ── GET ALL FOR CHIEF ─────────────────────────────────────────────────────
router.get('/chief/all-cases', auth, requireRole(['chief_doctor', 'chief']), async (req, res) => {
  try {
    console.log('[ORAL-API] GET /chief/all-cases by', {
      userId: req.user?._id,
      role: req.user?.role,
      department: req.user?.department,
      email: req.user?.email,
    });

    const cases = await OralCase.find()
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

    console.log(`[ORAL-API] /chief/all-cases returned ${data.length} cases`);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching all oral cases:', error?.stack || error);
    res.status(500).json({ success: false, message: 'Failed to fetch oral cases', error: String(error?.message || error) });
  }
});

// ── GET BY PATIENT ID ─────────────────────────────────────────────────────
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const rawId = String(req.params.patientId || '');
    const trimmed = rawId.trim();
    // Match exact, numeric-coerced, or whitespace-padded variants to be tolerant
    const regex = new RegExp(`^\\s*${escapeRegex(trimmed)}\\s*$`);

    const cases = await OralCase.find({ $or: [{ patientId: trimmed }, { patientId: { $regex: regex } }] })
      .sort({ createdAt: -1 });

    console.log(`[ORAL-API] GET /patient/${rawId} -> found ${Array.isArray(cases) ? cases.length : 0} cases`);
    res.status(200).json({ success: true, data: cases });
  } catch (error) {
    console.error('Error fetching patient oral cases:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch patient oral cases', error: error.message });
  }
});

// ── GET BY CASE ID ────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const oralCase = await OralCase.findById(req.params.id);
    if (!oralCase) {
      return res.status(404).json({ success: false, message: 'Oral case not found' });
    }
    // Debug: Log the signature field
    const hasSignature = !!(oralCase.digitalSignature || oralCase.doctorSignature || oralCase.pgSignature);
    if (hasSignature) {
      const sigLength = (oralCase.digitalSignature || '').length || (oralCase.doctorSignature || '').length || (oralCase.pgSignature || '').length;
      console.log(`[ORAL-API] GET /:id - Case ${req.params.id} has signature field, length: ${sigLength}`);
    } else {
      console.log(`[ORAL-API] GET /:id - Case ${req.params.id} has NO signature fields`);
    }
    res.status(200).json({ success: true, data: oralCase });
  } catch (error) {
    console.error('Error fetching oral case:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch oral case', error: error.message });
  }
});

// ── UPDATE ────────────────────────────────────────────────────────────────
router.put('/:id', auth, requireRole(['doctor', 'chief', 'pg', 'ug']), async (req, res) => {
  try {
    const payload = normalisePayload(req.body);
    
    // Debug: Log if signature is in the update payload
    if (payload.digitalSignature) {
      console.log(`[ORAL-API] PUT - Received digitalSignature, length: ${payload.digitalSignature.length}`);
    } else {
      console.log(`[ORAL-API] PUT - NO digitalSignature in update payload`);
    }
    
    const updatedCase = await OralCase.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );
    if (!updatedCase) {
      return res.status(404).json({ success: false, message: 'Oral case not found' });
    }
    
    // Debug: Log if signature was saved after update
    if (updatedCase.digitalSignature) {
      console.log(`[ORAL-API] PUT - Updated case with digitalSignature, length: ${updatedCase.digitalSignature.length}`);
    } else {
      console.log(`[ORAL-API] PUT - Updated case WITHOUT digitalSignature`);
    }

    // The frontend also calls /api/general/save to handle referral logic & PG assignments
    
    res.status(200).json({ success: true, message: 'Oral case updated successfully', data: updatedCase });
  } catch (error) {
    console.error('Error updating oral case:', error);
    res.status(500).json({ success: false, message: 'Failed to update oral case', error: error.message });
  }
});

// ── APPROVE / REJECT (CHIEF DOCTOR) ──────────────────────────────────────
router.patch('/:id/approve', auth, requireRole('chief_doctor'), async (req, res) => {
  try {
    const { chiefApproval, approvedBy, approvedAt } = req.body;
    const updatedCase = await OralCase.findByIdAndUpdate(
      req.params.id,
      { chiefApproval, approvedBy, approvedAt: approvedAt || new Date() },
      { new: true }
    );
    if (!updatedCase) {
      return res.status(404).json({ success: false, message: 'Oral case not found' });
    }
    res.status(200).json({ success: true, message: 'Oral case approval status updated', data: updatedCase });
  } catch (error) {
    console.error('Error approving oral case:', error);
    res.status(500).json({ success: false, message: 'Failed to update approval status', error: error.message });
  }
});

// ── DELETE ────────────────────────────────────────────────────────────────
router.delete('/:id', auth, requireRole(['chief_doctor', 'doctor']), async (req, res) => {
  try {
    const deletedCase = await OralCase.findByIdAndDelete(req.params.id);
    if (!deletedCase) {
      return res.status(404).json({ success: false, message: 'Oral case not found' });
    }
    res.status(200).json({ success: true, message: 'Oral case deleted successfully' });
  } catch (error) {
    console.error('Error deleting oral case:', error);
    res.status(500).json({ success: false, message: 'Failed to delete oral case', error: error.message });
  }
});

export default router;
