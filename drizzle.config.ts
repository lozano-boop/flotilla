
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

export default defineConfig({
  dialect: 'postgresql',
  schema: './shared/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: url!,
  },
});
