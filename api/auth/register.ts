import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { SubscriptionService } from '../../server/services/subscription-service';

interface User {
  id: string;
  nombre: string;
  rfc: string;
  created_at: Date;
  updated_at: Date;
}

interface CreateUserRequest {
  nombre: string;
  rfc: string;
  password: string;
}

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

function isValidRFC(rfc: string): boolean {
  const rfcPattern = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
  return rfcPattern.test(rfc.toUpperCase());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { nombre, rfc, password } = req.body as CreateUserRequest;
    
    if (!nombre || !rfc || !password) {
      return res.status(400).json({ message: "Todos los campos son requeridos" });
    }

    // Validar RFC
    if (!isValidRFC(rfc)) {
      return res.status(400).json({ message: 'RFC inválido' });
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

    // Crear suscripción de prueba automáticamente
    const subscriptionService = new SubscriptionService(pool);
    await subscriptionService.createTrialSubscription(user.id);
    
    res.status(201).json({ 
      message: "Usuario creado exitosamente con período de prueba de 30 días",
      user: { id: user.id, nombre: user.nombre, rfc: user.rfc }
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ message: 'El RFC ya está registrado' });
    }
    
    if (error.code === '42P01') { // Table does not exist
      return res.status(500).json({ message: 'Base de datos no inicializada. Contacta al administrador.' });
    }
    
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
