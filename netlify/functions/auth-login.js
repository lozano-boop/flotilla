const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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
    const { rfc, password } = JSON.parse(event.body);
    
    if (!rfc || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "RFC y contraseña son requeridos" })
      };
    }

    // Buscar usuario
    const result = await pool.query(
      'SELECT id, nombre, rfc, password_hash FROM users WHERE rfc = $1',
      [rfc.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'RFC o contraseña incorrectos' })
      };
    }

    const user = result.rows[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'RFC o contraseña incorrectos' })
      };
    }

    // Login exitoso
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Login exitoso",
        user: {
          id: user.id,
          nombre: user.nombre,
          rfc: user.rfc
        }
      })
    };
  } catch (error) {
    console.error('Error in login:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor' })
    };
  }
};
