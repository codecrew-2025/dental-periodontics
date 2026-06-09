// api/[...paths].js - Test minimal handler
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API catch-all working!',
    path: req.url,
    method: req.method
  });
}
