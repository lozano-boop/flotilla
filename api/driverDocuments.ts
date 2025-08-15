import { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { driverDocuments } from '../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    return res.status(500).json({ error: 'NEON_DATABASE_URL not set' });
  }
  const db = drizzle(connectionString);

  if (req.method === 'GET') {
    const allDocs = await db.select().from(driverDocuments);
    return res.status(200).json(allDocs);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
