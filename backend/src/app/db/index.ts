import { Pool, PoolConfig } from 'pg';
import config from '../config';

const poolConfig: PoolConfig = {
  connectionString: config.database_url,
  ssl:
    process.env.NODE_ENV === 'development' &&
    !config.database_url?.includes('supabase.co') &&
    !config.database_url?.includes('pooler.supabase.com')
      ? false
      : {
          rejectUnauthorized: false,
        },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err: Error) => {
  console.error(' Unexpected error on idle PostgreSQL client:', err.message);
});

export const query = (text: string, params?: unknown[]) => {
  return pool.query(text, params);
};

export const closeDbPool = async (): Promise<void> => {
  try {
    await pool.end();
    console.log(' PostgreSQL pool closed gracefully.');
  } catch (error) {
    console.error(' Error while closing PostgreSQL pool:', error);
  }
};

export default pool;
