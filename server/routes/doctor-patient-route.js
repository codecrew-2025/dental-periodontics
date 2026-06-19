// server/routes/doctor-patient-route.js
import { Router } from 'express';
import { PatientDetails } from '../models/patientDetails.js';  
import { User } from '../models/User.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
const router = Router();

router.get('/:patientId', async (req, res) => {
  try {
    // Attempt to populate req.user if a Bearer token was supplied, but do not fail when absent.
    const authHeader = req.header('Authorization') || req.header('authorization');
    if (authHeader && String(authHeader || '').startsWith('Bearer ')) {
      const token = String(authHeader).replace('Bearer ', '');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
        const caller = await User.findOne({ _id: decoded.userId }).select('-password').lean();
        if (caller) req.user = caller;
      } catch (err) {
        // Ignore token errors — route remains usable without auth for basic lookups
        console.log('[doctor-patient-route] Token parse failed (continuing unauthenticated):', err.message);
      }
    }

    const patient = await PatientDetails.findOne({ patientId: req.params.patientId });

    if (!patient) {
      // If not found in PatientDetails, allow an authenticated doctor from Public Health Dentistry
      // to look up camp-registered patients that exist as User records (Identity starting with 'C').
      const normalizedId = String(req.params.patientId || '').trim();
      const looksLikeCampId = /^c/i.test(normalizedId);

      if (looksLikeCampId && req.user && String(req.user.department || '').toLowerCase().includes('public health')) {
        const linked = await User.findOne({ Identity: normalizedId }).lean();
        if (linked) {
          const fullName = String(linked?.name || '').trim();
          const nameParts = fullName.split(/\s+/).filter(Boolean);
          const fallbackPatient = {
            patientId: String(linked.Identity || normalizedId).trim(),
            personalInfo: {
              firstName: nameParts[0] || fullName || '',
              middleName: '',
              lastName: nameParts.slice(1).join(' '),
              phone: linked?.phone || '',
              email: linked?.email || '',
            },
            medicalInfo: {},
            vitals: {},
            status: 'active',
            createdAt: linked?.createdAt || new Date(),
            source: 'user-fallback',
          };

          return res.json({ success: true, data: fallbackPatient, patient: fallbackPatient, source: 'user-fallback' });
        }
      }

      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found' 
      });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Check if patient ID exists
router.get('/check-id/:patientId', async (req, res) => {
  try {
    const patient = await PatientDetails.findOne({ patientId: req.params.patientId });
    res.json({ 
      success: true,
      exists: !!patient 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Create or update patient
router.post('/', async (req, res) => {
  try {
    const { patientId, ...patientData } = req.body;
    console.log('[doctor-patient POST] patientId:', patientId);

    if (!patientId || String(patientId).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'patientId is required'
      });
    }

    // Ensure pregnancyStatus is always a valid enum value when not applicable
    if (patientData?.medicalInfo) {
      const status = patientData.medicalInfo.pregnancyStatus;
      if (!status || String(status).trim() === '') {
        patientData.medicalInfo.pregnancyStatus = 'N/A';
      }
      // Remove null/empty date fields to avoid cast errors
      if (!patientData.medicalInfo.lastDentalVisit) {
        delete patientData.medicalInfo.lastDentalVisit;
      }
    }

    // Remove null/empty date fields from personalInfo
    if (patientData?.personalInfo) {
      if (!patientData.personalInfo.dateOfBirth) {
        delete patientData.personalInfo.dateOfBirth;
      }
    }

    // Remove null/empty date fields from institutionInfo
    if (patientData?.institutionInfo) {
      if (!patientData.institutionInfo.campDate) {
        delete patientData.institutionInfo.campDate;
      }
    }

    // Ensure bloodGroup is a valid enum value (empty string if not provided)
    if (patientData?.vitals) {
      const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''];
      if (!validBloodGroups.includes(patientData.vitals.bloodGroup)) {
        patientData.vitals.bloodGroup = '';
      }
    }

    // Atomic upsert — avoids race condition from concurrent saves
    const patient = await PatientDetails.findOneAndUpdate(
      { patientId },
      {
        $set: { ...patientData, updatedAt: new Date() },
        $setOnInsert: { patientId, userId: new mongoose.Types.ObjectId() }
      },
      { new: true, upsert: true, runValidators: false }
    );

    console.log('[doctor-patient POST] SUCCESS for patientId:', patientId);
    return res.json({
      success: true,
      message: 'Patient saved successfully',
      patientId: patient.patientId,
      patientName: `${patient.personalInfo?.firstName || ''} ${patient.personalInfo?.lastName || ''}`.trim(),
      age: patient.personalInfo?.age
    });
  } catch (error) {
    console.error('[doctor-patient POST] FULL ERROR:', error);
    console.error('[doctor-patient POST] Error name:', error.name);
    console.error('[doctor-patient POST] Error message:', error.message);
    console.error('[doctor-patient POST] Error code:', error.code);
    if (error.errors) {
      console.error('[doctor-patient POST] Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    // Handle duplicate key gracefully
    if (error.code === 11000) {
      return res.status(500).json({
        success: false,
        message: 'A save conflict occurred. Please try again.'
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: error.message,
      details: error?.errors ? Object.keys(error.errors).map(k => `${k}: ${error.errors[k].message}`) : undefined
    });
  }
});

export default router;
