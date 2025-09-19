const { Pool } = require('pg');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    const { planId, userId } = JSON.parse(event.body);
    
    if (!planId || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Plan ID y User ID son requeridos" })
      };
    }

    // Get user info
    const userResult = await pool.query(
      'SELECT id, nombre, rfc FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Usuario no encontrado' })
      };
    }

    const user = userResult.rows[0];

    // Get plan info
    const planResult = await pool.query(
      'SELECT id, name, price FROM subscription_plans WHERE id = $1',
      [planId]
    );

    if (planResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Plan no encontrado' })
      };
    }

    const plan = planResult.rows[0];

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100), // Convert to cents
      currency: 'mxn',
      metadata: {
        userId: user.id,
        planId: plan.id,
        userRfc: user.rfc,
        userName: user.nombre,
        planName: plan.name
      }
    });

    // Save upgrade request to database
    await pool.query(
      `INSERT INTO subscription_upgrades (user_id, plan_id, amount, payment_intent_id, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [user.id, plan.id, plan.price, paymentIntent.id]
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      })
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor' })
    };
  }
};
