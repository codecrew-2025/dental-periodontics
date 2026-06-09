// api/[...paths].js - Catch-all serverless handler
import dotenv from 'dotenv';
import app from '../server/Server.js';

// Load .env only in local development  
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Vercel wraps this export as a serverless function handler
export default app;
