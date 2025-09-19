import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

interface User {
  id: string;
  nombre: string;
  rfc: string;
  created_at: Date;
  updated_at: Date;
}

interface LoginRequest {
  rfc: string;
  password: string;
}

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { rfc, password } = req.body as LoginRequest;
    
    if (!rfc || !password) {
      return res.status(400).json({ message: "RFC y contraseña son requeridos" });
    }

    // Buscar usuario
    const result = await pool.query(
      `SELECT id, nombre, rfc, password_hash, created_at, updated_at 
       FROM users WHERE rfc = $1`,
      [rfc.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "RFC o contraseña incorrectos" });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: "RFC o contraseña incorrectos" });
    }

    // Retornar usuario sin el hash de contraseña
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({ 
      message: "Login exitoso",
      user: { id: userWithoutPassword.id, nombre: userWithoutPassword.nombre, rfc: userWithoutPassword.rfc }
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    
    if (error.code === '42P01') { // Table does not exist
      return res.status(500).json({ message: 'Base de datos no inicializada. Contacta al administrador.' });
    }
    
    res.status(500).json({ message: "Error interno del servidor" });
  }
}
