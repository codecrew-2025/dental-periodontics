import { Router } from 'express';
import auth from '../middleware/auth.js';
import ConsentDraft from '../models/ConsentDraft.js';

const router = Router();
const normalizeValue = (value) => String(value || '').trim();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const patientId = normalizeValue(req.query.patientId);
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'patientId is required' });
    }

    const draft = await ConsentDraft.findOne({ patientId })
      .select('patientId data updatedAt')
      .lean();

    return res.json({ success: true, draft: draft || null });
  } catch (error) {
    console.error('Error loading consent draft:', error);
    return res.status(500).json({ success: false, message: 'Failed to load consent draft' });
  }
});

router.put('/', async (req, res) => {
  try {
    const patientId = normalizeValue(req.body?.patientId);
    const data = req.body?.data && typeof req.body.data === 'object' ? req.body.data : {};

    if (!patientId) {
      return res.status(400).json({ success: false, message: 'patientId is required' });
    }

    const draft = await ConsentDraft.findOneAndUpdate(
      { patientId },
      { $set: { data, updatedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .select('patientId data updatedAt')
      .lean();

    return res.json({ success: true, draft });
  } catch (error) {
    console.error('Error saving consent draft:', error);
    return res.status(500).json({ success: false, message: 'Failed to save consent draft' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const patientId = normalizeValue(req.query.patientId);
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'patientId is required' });
    }

    await ConsentDraft.deleteOne({ patientId });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error clearing consent draft:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear consent draft' });
  }
});

export default router;
