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

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface SubscriptionUpgrade {
  userId: number;
  planId: number;
  amount: number;
  paymentIntentId: string;
}

export class PaymentService {
  static async createPaymentIntent(
    amount: number,
    currency: string = 'mxn',
    metadata: Record<string, string> = {}
  ): Promise<PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe uses cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  static async createSubscriptionUpgrade(
    userId: number,
    planId: number
  ): Promise<{ paymentIntent: PaymentIntent; upgradeId: number }> {
    try {
      // Get plan details
      const planQuery = `
        SELECT * FROM subscription_plans 
        WHERE id = $1
      `;
      const planResult = await db.query(planQuery, [planId]);
      
      if (planResult.rows.length === 0) {
        throw new Error('Plan not found');
      }

      const plan = planResult.rows[0];
      
      // Get user details for metadata
      const userQuery = `
        SELECT nombre, rfc FROM users 
        WHERE id = $1
      `;
      const userResult = await db.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(
        plan.price,
        'mxn',
        {
          userId: userId.toString(),
          planId: planId.toString(),
          planName: plan.name,
          userRFC: user.rfc,
          userName: user.nombre,
        }
      );

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

      return {
        paymentIntent,
        upgradeId: upgradeResult.rows[0].id,
      };
    } catch (error) {
      console.error('Error creating subscription upgrade:', error);
      throw new Error('Failed to create subscription upgrade');
    }
  }

  static async confirmPayment(paymentIntentId: string): Promise<boolean> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
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
          await this.upgradeUserSubscription(user_id, plan_id);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  static async upgradeUserSubscription(userId: number, planId: number): Promise<void> {
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
      throw new Error('Failed to upgrade user subscription');
    }
  }

  static async handleWebhook(signature: string, payload: Buffer): Promise<void> {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await this.confirmPayment(paymentIntent.id);
          break;
        
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          await this.handleFailedPayment(failedPayment.id);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw new Error('Webhook handling failed');
    }
  }

  static async handleFailedPayment(paymentIntentId: string): Promise<void> {
    try {
      const updateQuery = `
        UPDATE subscription_upgrades 
        SET status = 'failed', updated_at = NOW()
        WHERE payment_intent_id = $1
      `;
      
      await db.query(updateQuery, [paymentIntentId]);
    } catch (error) {
      console.error('Error handling failed payment:', error);
    }
  }

  static async getUpgradeHistory(userId: number): Promise<any[]> {
    try {
      const query = `
        SELECT 
          su.*,
          sp.name as plan_name,
          sp.price as plan_price
        FROM subscription_upgrades su
        JOIN subscription_plans sp ON su.plan_id = sp.id
        WHERE su.user_id = $1
        ORDER BY su.created_at DESC
      `;
      
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting upgrade history:', error);
      throw new Error('Failed to get upgrade history');
    }
  }
}
