import { query } from './index';

/**
 * Tests the PostgreSQL / Supabase connection by running `SELECT NOW()`
 */
export const testDbConnection = async (): Promise<boolean> => {
  try {
    const res = await query('SELECT NOW()');
    console.log(
      ' PostgreSQL (Supabase) connected successfully! Server time:',
      res.rows[0]?.now,
    );
    return true;
  } catch (error: any) {
    console.error('PostgreSQL connection failed:', error.message || error);
    return false;
  }
};

if (require.main === module) {
  testDbConnection()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Unexpected error in connection test runner:', err);
      process.exit(1);
    });
}
