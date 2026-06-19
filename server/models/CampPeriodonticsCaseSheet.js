import mongoose from 'mongoose';

const CampPeriodonticsCaseSheetSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    index: true
  },
  campSerialNo: {
    type: String,
    default: ''
  },
  venueName: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  patientName: {
    type: String,
    default: ''
  },
  age: {
    type: String,
    default: ''
  },
  sex: {
    type: String,
    default: ''
  },
  diagnosis: {
    type: String,
    default: ''
  },
  treatmentPlan: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    default: ''
  },
  doctorName: {
    type: String,
    default: ''
  },
  digitalSignature: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.models.CampPeriodonticsCaseSheet || mongoose.model('CampPeriodonticsCaseSheet', CampPeriodonticsCaseSheetSchema);
