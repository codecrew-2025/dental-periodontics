import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import ConsentForm from './models/ConsentForm.js';
import OralCase from './models/Oral-model.js';
import GeneralCase from './models/GeneralCase.js';
import PedodonticsCase from './models/PedodonticsCase.js';
import PeriodonticsCaseModel from './models/PeriodonticsCaseModel.js';
import CampPeriodonticsCaseSheet from './models/CampPeriodonticsCaseSheet.js';
import CaseDraft from './models/CaseDraft.js';
import ConsentDraft from './models/ConsentDraft.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("ERROR: MONGO_URI is not set in .env");
  process.exit(1);
}

const runCleanup = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("✅ Connected to MongoDB.");

    console.log("\nStarting Deep Cleanup Process...");
    console.log("Deleting all case sheets and consent forms. Users and Patient Details will be kept intact.");

    const modelsToDelete = [
      { name: 'ConsentForm', model: ConsentForm },
      { name: 'OralCase', model: OralCase },
      { name: 'GeneralCase', model: GeneralCase },
      { name: 'PedodonticsCase', model: PedodonticsCase },
      { name: 'PeriodonticsCase', model: PeriodonticsCaseModel },
      { name: 'CampPeriodonticsCaseSheet', model: CampPeriodonticsCaseSheet },
      { name: 'CaseDraft', model: CaseDraft },
      { name: 'ConsentDraft', model: ConsentDraft }
    ];

    for (const { name, model } of modelsToDelete) {
      if (model) {
        const result = await model.deleteMany({});
        console.log(`🗑️ Deleted ${result.deletedCount} documents from ${name}.`);
      }
    }

    console.log("\n✅ MongoDB Deep Cleanup completed successfully! All case sheets have been deleted. You now have plenty of space!");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB. You can now close this script.");
    process.exit(0);
  }
};

runCleanup();
