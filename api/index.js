// api/index.js - Vercel serverless handler for Express backend
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(path.join(process.cwd(), 'api'));
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Import Server.js app (already configured Express app)
import app from '../server/Server.js';

// Export handler for Vercel
export default app;
