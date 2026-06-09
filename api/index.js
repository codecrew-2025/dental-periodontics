// api/index.js - Vercel serverless handler for Express backend
import dotenv from 'dotenv';
import app from '../server/Server.js';

// Load .env only in local development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Export Express app - Vercel will wrap it as a serverless handler
export default app;
