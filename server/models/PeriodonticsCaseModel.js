// server/models/PeriodonticsCaseModel.js
import mongoose from 'mongoose';

const PeriodonticsCaseSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    ref: 'patientDetails'
  },
  patientName: {
    type: String,
    required: true
  },
  doctorId: {
    type: String,
    required: true,
    ref: 'User'
  },
  doctorName: {
    type: String,
    required: true
  },
  
  // Medical History & Examination
  medicalHistory: String,
  dentalHistory: String,
  currentMedications: String,
  allergies: String,
  
  // Clinical Examination
  probing: String,
  bleeding: String,
  pocketing: String,
  furcation: String,
  attachment: String,
  mobility: String,
  
  // Diagnosis & Treatment
  diagnosis: String,
  treatment: String,
  treatmentPlan: String,
  finalDiagnosis: String,
  
  // Digital Signature
  digitalSignature: {
    data: Buffer,
    contentType: String,
    fileName: String
  },
  
  // Approval Status
  chiefApproval: String,
  approvedBy: {
    type: String
  },
  approvedAt: {
    type: Date
  },

  // Referral
  referredDepartment: {
    type: String,
    default: null
  },

  // Additional notes
  additionalNotes: String,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { strict: false });

// Update the updatedAt field before saving
PeriodonticsCaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.PeriodonticsCaseModel || mongoose.model('PeriodonticsCaseModel', PeriodonticsCaseSchema);
