import mongoose from 'mongoose';

const ConsentDraftSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ConsentDraftSchema.index({ patientId: 1 }, { unique: true });
ConsentDraftSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 }); // Expire after 1 day

export default mongoose.models.ConsentDraft ||
  mongoose.model('ConsentDraft', ConsentDraftSchema);
