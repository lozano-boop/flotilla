import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { SubscriptionService } from './subscription-service';

export interface User {
  id: string;
  nombre: string;
  rfc: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserRequest {
  nombre: string;
  rfc: string;
  password: string;
}

export interface LoginRequest {
  rfc: string;
  password: string;
}

export class UserService {
  private pool: Pool;
  private subscriptionService: SubscriptionService;

  constructor(pool: Pool) {
    this.pool = pool;
    this.subscriptionService = new SubscriptionService(pool);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const { nombre, rfc, password } = userData;
    
    if (!this.isValidRFC(rfc)) {
      throw new Error('RFC inválido');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    try {
      const result = await this.pool.query(
        `INSERT INTO users (nombre, rfc, password_hash) 
         VALUES ($1, $2, $3) 
         RETURNING id, nombre, rfc, created_at, updated_at`,
        [nombre, rfc.toUpperCase(), passwordHash]
      );

      const user = result.rows[0];

      // Crear suscripción de prueba automáticamente para nuevos usuarios
      await this.subscriptionService.createTrialSubscription(user.id);

      return user;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('El RFC ya está registrado');
      }
      throw new Error('Error al crear usuario: ' + error.message);
    }
  }

  async authenticateUser(loginData: LoginRequest): Promise<User | null> {
    const { rfc, password } = loginData;

    try {
      const result = await this.pool.query(
        `SELECT id, nombre, rfc, password_hash, created_at, updated_at 
         FROM users WHERE rfc = $1`,
        [rfc.toUpperCase()]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return null;
      }

      // Retornar usuario sin el hash de contraseña
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw new Error('Error al autenticar usuario');
    }
  }

  async getUserByRFC(rfc: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        `SELECT id, nombre, rfc, created_at, updated_at 
         FROM users WHERE rfc = $1`,
        [rfc.toUpperCase()]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error('Error al buscar usuario');
    }
  }

  private isValidRFC(rfc: string): boolean {
    // Validación básica de RFC (12-13 caracteres alfanuméricos)
    const rfcPattern = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    return rfcPattern.test(rfc.toUpperCase());
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await this.pool.query(
        `SELECT id, nombre, rfc, created_at, updated_at 
         FROM users ORDER BY created_at DESC`
      );

      return result.rows;
    } catch (error) {
      throw new Error('Error al obtener usuarios');
    }
  }
}
