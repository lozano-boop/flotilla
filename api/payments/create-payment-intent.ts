import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { Pool } from 'pg';

// Initialize database connection
const db = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({ message: 'userId and planId are required' });
    }

    // Get plan details
    const planQuery = `
      SELECT * FROM subscription_plans 
      WHERE id = $1 AND is_active = true
    `;
    const planResult = await db.query(planQuery, [planId]);
    
    if (planResult.rows.length === 0) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const plan = planResult.rows[0];
    
    // Get user details for metadata
    const userQuery = `
      SELECT nombre, rfc FROM users 
      WHERE id = $1
    `;
    const userResult = await db.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100), // Stripe uses cents
      currency: 'mxn',
      metadata: {
        userId: userId.toString(),
        planId: planId.toString(),
        planName: plan.name,
        userRFC: user.rfc,
        userName: user.nombre,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store upgrade request in database
    const upgradeQuery = `
      INSERT INTO subscription_upgrades 
      (user_id, plan_id, amount, payment_intent_id, status, created_at)
      VALUES ($1, $2, $3, $4, 'pending', NOW())
      RETURNING id
    `;
    
    const upgradeResult = await db.query(upgradeQuery, [
      userId,
      planId,
      plan.price,
      paymentIntent.id,
    ]);

    res.json({
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
      upgradeId: upgradeResult.rows[0].id,
      plan: {
        name: plan.name,
        price: plan.price,
      }
    });

  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      message: 'Error creating payment intent',
      error: error.message 
    });
  }
}
