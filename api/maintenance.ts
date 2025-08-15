import { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { maintenanceRecords } from '../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    return res.status(500).json({ error: 'NEON_DATABASE_URL not set' });
  }
  const db = drizzle(connectionString);

  if (req.method === 'GET') {
    const allRecords = await db.select().from(maintenanceRecords);
    return res.status(200).json(allRecords);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
