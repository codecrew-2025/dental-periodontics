import express from 'express';
import CampPeriodonticsCaseSheet from '../models/CampPeriodonticsCaseSheet.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/camp-periodontics/case/:caseId
// Fetch a specific case sheet by its ID (must be before /:patientId)
router.get('/case/:caseId', auth, async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseSheet = await CampPeriodonticsCaseSheet.findById(caseId);
    
    if (!caseSheet) {
      return res.status(404).json({ success: false, message: 'Case sheet not found' });
    }
    
    res.status(200).json({ success: true, data: caseSheet });
  } catch (error) {
    console.error('Error fetching Camp Periodontics Case Sheet by ID:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// POST /api/camp-periodontics/save
// Save a new case sheet
router.post('/save', auth, async (req, res) => {
  try {
    const { patientId, campSerialNo, venueName, date, patientName, age, sex, diagnosis, treatmentPlan, remarks, doctorName, digitalSignature } = req.body;

    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient ID is required' });
    }

    const payload = {
      patientId,
      campSerialNo: campSerialNo || '',
      venueName: venueName || '',
      date: date || new Date(),
      patientName: patientName || '',
      age: age || '',
      sex: sex || '',
      diagnosis: diagnosis || '',
      treatmentPlan: treatmentPlan || '',
      remarks: remarks || '',
      doctorName: doctorName || '',
      digitalSignature: digitalSignature || ''
    };

    const newCaseSheet = new CampPeriodonticsCaseSheet(payload);
    const savedCaseSheet = await newCaseSheet.save();

    res.status(200).json({ success: true, message: 'Case sheet saved successfully', data: savedCaseSheet });
  } catch (error) {
    console.error('Error saving Camp Periodontics Case Sheet:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/camp-periodontics/:patientId
// Fetch all existing case sheets for a patient (catch-all — must be LAST)
router.get('/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const caseSheets = await CampPeriodonticsCaseSheet.find({ patientId }).sort({ createdAt: -1 });
    
    if (!caseSheets || caseSheets.length === 0) {
      return res.status(200).json({ success: true, data: [], message: 'No case sheets found for this patient' });
    }
    
    res.status(200).json({ success: true, data: caseSheets });
  } catch (error) {
    console.error('Error fetching Camp Periodontics Case Sheet:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

export default router;
