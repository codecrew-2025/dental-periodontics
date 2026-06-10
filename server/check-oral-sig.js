import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OralCase from './models/Oral-model.js';

dotenv.config();

const caseId = process.argv[2];
if (!caseId) {
  console.error('Usage: node check-oral-sig.js <caseId>');
  process.exit(2);
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { connectTimeoutMS: 5000 });
    const doc = await OralCase.findById(caseId).lean();
    if (!doc) {
      console.log(`Case ${caseId} not found`);
      process.exit(0);
    }

    const inspect = (v) => {
      if (v === undefined) return 'undefined';
      if (v === null) return 'null';
      if (typeof v === 'string') return `string (${v.length})`;
      if (Array.isArray(v)) return `array (${v.length})`;
      if (v && typeof v === 'object') return `object (keys=${Object.keys(v).length})`;
      return typeof v;
    };

    console.log('Case _id:', doc._id);
    console.log('department:', doc.department || '(none)');
    console.log('digitalSignature:', inspect(doc.digitalSignature));
    console.log('doctorSignature:', inspect(doc.doctorSignature));
    console.log('pgSignature:', inspect(doc.pgSignature));
    console.log('oralCode:', inspect(doc.oralCode));
    console.log('other keys (sample):', Object.keys(doc).slice(0,50));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

run();
