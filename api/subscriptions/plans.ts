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
    const subscriptionService = new SubscriptionService(pool);
    const plans = await subscriptionService.getActivePlans();
    
    res.status(200).json({ plans });
  } catch (error: any) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
