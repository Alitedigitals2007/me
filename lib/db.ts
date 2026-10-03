import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
          ? false
          : { rejectUnauthorized: false },
      max: 10
    });
  }
  return pool;
}

export default getPool;
