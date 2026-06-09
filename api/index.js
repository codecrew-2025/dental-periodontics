// api/index.js - Vercel serverless function to export the Express app
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the main app from Server.js
import('../server/Server.js').then((module) => {
  // The Server.js already starts listening, but for Vercel we just export the app
}).catch((err) => {
  console.error('Failed to load Server.js:', err);
});

// Re-export from Server.js for Vercel
export { default } from '../server/Server.js';
