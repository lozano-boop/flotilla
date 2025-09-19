import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND_URL = 'https://flotilla-manager-a395al66o-lozanos-projects-1f482492.vercel.app';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;
    
    if (!action || (action !== 'login' && action !== 'register')) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const targetUrl = `${BACKEND_URL}/api/auth/${action}`;
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ message: 'Internal proxy error' });
  }
}
