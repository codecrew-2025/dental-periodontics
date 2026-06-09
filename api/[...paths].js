// api/[...paths].js - Express app handler
let appInstance;

async function getApp() {
  if (!appInstance) {
    try {
      const module = await import('../server/Server.js');
      appInstance = module.default;
      console.log('✓ Express app loaded successfully');
    } catch (error) {
      console.error('✗ Failed to load Express app:', error?.message || error);
      throw error;
    }
  }
  return appInstance;
}

export default async function handler(req, res) {
  try {
    const app = await getApp();
    // Call the Express app  as a middleware/handler
    return new Promise((resolve) => {
      app(req, res, () => {
        // Catch-all fallback if no route matched
        if (!res.writableEnded) {
          res.status(404).json({ message: 'Route not found' });
        }
        resolve();
      });
    });
  } catch (error) {
    console.error('❌ Handler error:', error?.message || error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error'
    });
  }
}
