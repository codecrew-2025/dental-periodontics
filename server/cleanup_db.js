import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ConsentForm from './models/ConsentForm.js';
import OralCase from './models/Oral-model.js';
import GeneralCase from './models/GeneralCase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI is not set in .env");
  process.exit(1);
}

const runCleanup = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("✅ Connected to MongoDB.");

    console.log("\nStarting Cleanup Process...");
    console.log("Prioritizing removal of large base64 videos and images to free up 512MB quota...");

    // 1. Unset videoConsentData and signatureImage from ConsentForm
    const consentResult = await ConsentForm.updateMany(
      {},
      { $unset: { videoConsentData: 1, signatureImage: 1 } }
    );
    console.log(`🧹 Cleared video/images from ${consentResult.modifiedCount} ConsentForm documents.`);

    // 2. Unset large fields from OralCase
    const oralResult = await OralCase.updateMany(
      {},
      { $unset: { digitalSignature: 1 } }
    );
    console.log(`🧹 Cleared digital signatures from ${oralResult.modifiedCount} OralCase documents.`);

    // 3. Unset large fields from GeneralCase
    const generalResult = await GeneralCase.updateMany(
      {},
      { $unset: { xrayImage: 1, digitalSignature: 1, doctorSignature: 1, pgSignature: 1 } }
    );
    console.log(`🧹 Cleared x-rays and signatures from ${generalResult.modifiedCount} GeneralCase documents.`);

    // OPTIONAL: Delete really old consent forms completely (e.g. older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const deleteConsentResult = await ConsentForm.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });
    console.log(`🗑️ Completely deleted ${deleteConsentResult.deletedCount} ConsentForm documents older than 30 days.`);

    console.log("\n✅ Cleanup completed successfully! Your MongoDB Atlas cluster should now have space.");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB. You can now close this script.");
    process.exit(0);
  }
};

runCleanup();
