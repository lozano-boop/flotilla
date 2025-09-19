import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { SubscriptionService } from '../../server/services/subscription-service';

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: 'User ID requerido' });
    }

    const subscriptionService = new SubscriptionService(pool);
    const subscriptionInfo = await subscriptionService.getUserSubscriptionInfo(userId);
    
    res.status(200).json(subscriptionInfo);
  } catch (error: any) {
    console.error('Error fetching user subscription info:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
