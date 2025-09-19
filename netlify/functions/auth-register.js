const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function isValidRFC(rfc) {
  const rfcPattern = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
  return rfcPattern.test(rfc.toUpperCase());
}

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
    const { nombre, rfc, password } = JSON.parse(event.body);
    
    if (!nombre || !rfc || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Todos los campos son requeridos" })
      };
    }

    // Validar RFC
    if (!isValidRFC(rfc)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'RFC inválido' })
      };
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const result = await pool.query(
      `INSERT INTO users (nombre, rfc, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, nombre, rfc, created_at, updated_at`,
      [nombre, rfc.toUpperCase(), passwordHash]
    );

    const user = result.rows[0];

    // Crear suscripción gratuita automáticamente
    await pool.query(
      `INSERT INTO subscriptions (user_id, plan_id, status, created_at, updated_at)
       VALUES ($1, 1, 'active', NOW(), NOW())`,
      [user.id]
    );
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ 
        message: "Usuario creado exitosamente con plan gratuito",
        user: { id: user.id, nombre: user.nombre, rfc: user.rfc }
      })
    };
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'El RFC ya está registrado' })
      };
    }
    
    if (error.code === '42P01') { // Table does not exist
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: 'Base de datos no inicializada. Contacta al administrador.' })
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor' })
    };
  }
};
