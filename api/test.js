export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API работает на Vercel!',
    timestamp: new Date().toISOString()
  });
}