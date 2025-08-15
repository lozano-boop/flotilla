import { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { expenses } from '../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    return res.status(500).json({ error: 'NEON_DATABASE_URL not set' });
  }
  const client = neon(connectionString);
  const db = drizzle(client);

  if (req.method === 'GET') {
    const allExpenses = await db.select().from(expenses);
    return res.status(200).json(allExpenses);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
