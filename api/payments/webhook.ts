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

  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    // Get raw body for webhook verification
    const body = JSON.stringify(req.body);
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handleSuccessfulPayment(paymentIntent.id);
        break;
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handleFailedPayment(failedPayment.id);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ 
      message: 'Webhook handling failed',
      error: error.message 
    });
  }
}

async function handleSuccessfulPayment(paymentIntentId: string): Promise<void> {
  try {
    // Update upgrade status
    const updateQuery = `
      UPDATE subscription_upgrades 
      SET status = 'completed', updated_at = NOW()
      WHERE payment_intent_id = $1
      RETURNING user_id, plan_id
    `;
    
    const result = await db.query(updateQuery, [paymentIntentId]);
    
    if (result.rows.length > 0) {
      const { user_id, plan_id } = result.rows[0];
      
      // Update user subscription
      await upgradeUserSubscription(user_id, plan_id);
      console.log(`Successfully upgraded user ${user_id} to plan ${plan_id}`);
    }
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
}

async function handleFailedPayment(paymentIntentId: string): Promise<void> {
  try {
    const updateQuery = `
      UPDATE subscription_upgrades 
      SET status = 'failed', updated_at = NOW()
      WHERE payment_intent_id = $1
    `;
    
    await db.query(updateQuery, [paymentIntentId]);
    console.log(`Marked payment as failed for intent: ${paymentIntentId}`);
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
}

async function upgradeUserSubscription(userId: number, planId: number): Promise<void> {
  try {
    const updateQuery = `
      UPDATE subscriptions 
      SET plan_id = $1, 
          status = 'active',
          updated_at = NOW()
      WHERE user_id = $2
    `;
    
    await db.query(updateQuery, [planId, userId]);
  } catch (error) {
    console.error('Error upgrading user subscription:', error);
    throw error;
  }
}
