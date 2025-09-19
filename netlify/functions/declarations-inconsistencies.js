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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let client;

  try {
    // Connect to database
    client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    // Mock inconsistencies detection logic
    // In a real implementation, this would compare CFDI data with declarations
    const inconsistencies = [
      {
        id: 1,
        tipo: 'Ingresos no declarados',
        descripcion: 'Se detectaron ingresos CFDI en enero 2024 pero la declaración está en ceros',
        periodo: '2024-01',
        monto: 25000.00,
        severidad: 'alta'
      },
      {
        id: 2,
        tipo: 'Diferencia significativa',
        descripcion: 'Diferencia del 15% entre ingresos CFDI y declarados en febrero 2024',
        periodo: '2024-02',
        monto: 8500.00,
        severidad: 'media'
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(inconsistencies)
    };

  } catch (error) {
    console.error('Error fetching inconsistencies:', error);
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
