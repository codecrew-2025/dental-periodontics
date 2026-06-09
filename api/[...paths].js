// api/[...paths].js - Catch-all serverless handler for Express app
import dotenv from 'dotenv';

// Load .env only in local development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Dynamically import the app to avoid circular dependencies and ensure .env is loaded first
let appPromise;

async function getApp() {
  if (!appPromise) {
    appPromise = import('../server/Server.js').then(m => m.default);
  }
  return appPromise;
}

// Export handler function - required by Vercel
export default async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}
