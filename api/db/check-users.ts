import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

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
    // Get all users with their subscription info
    const usersQuery = `
      SELECT 
        u.id,
        u.nombre,
        u.rfc,
        u.created_at,
        u.updated_at,
        s.status as subscription_status,
        s.trial_ends_at,
        sp.name as plan_name,
        sp.price,
        sp.max_records
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
      ORDER BY u.created_at DESC
    `;
    
    const usersResult = await pool.query(usersQuery);
    
    // Get subscription plans
    const plansQuery = `
      SELECT * FROM subscription_plans 
      ORDER BY price ASC
    `;
    
    const plansResult = await pool.query(plansQuery);
    
    // Get subscription upgrades
    const upgradesQuery = `
      SELECT 
        su.*,
        u.nombre,
        u.rfc,
        sp.name as plan_name
      FROM subscription_upgrades su
      JOIN users u ON su.user_id = u.id
      JOIN subscription_plans sp ON su.plan_id = sp.id
      ORDER BY su.created_at DESC
    `;
    
    const upgradesResult = await pool.query(upgradesQuery);

    res.json({
      message: "Database check completed successfully",
      users: usersResult.rows,
      plans: plansResult.rows,
      upgrades: upgradesResult.rows,
      stats: {
        totalUsers: usersResult.rows.length,
        totalPlans: plansResult.rows.length,
        totalUpgrades: upgradesResult.rows.length
      }
    });
    
  } catch (error: any) {
    console.error('Error checking database:', error);
    res.status(500).json({ 
      message: 'Error checking database',
      error: error.message 
    });
  }
}
