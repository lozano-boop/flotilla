const { Client } = require('pg');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let client;

  try {
    // Parse form data from event body
    const contentType = event.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Content-Type debe ser multipart/form-data' })
      };
    }

    // Connect to database
    client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    // Create declarations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS declarations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tipo VARCHAR(20) NOT NULL,
        periodo VARCHAR(10) NOT NULL,
        estado VARCHAR(20) NOT NULL,
        archivo_nombre VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // For demo purposes, create a mock declaration entry
    const mockDeclaration = {
      tipo: 'mensual',
      periodo: '2024-01', 
      estado: 'datos',
      archivo_nombre: 'declaracion_' + Date.now() + '.pdf'
    };

    // Insert mock declaration into database
    const result = await client.query(`
      INSERT INTO declarations (tipo, periodo, estado, archivo_nombre)
      VALUES ($1, $2, $3, $4)
      RETURNING id, tipo, periodo, estado, archivo_nombre, created_at
    `, [mockDeclaration.tipo, mockDeclaration.periodo, mockDeclaration.estado, mockDeclaration.archivo_nombre]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Declaración subida exitosamente',
        declaration: result.rows[0]
      })
    };

  } catch (error) {
    console.error('Error uploading declarations:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error.message 
      })
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
