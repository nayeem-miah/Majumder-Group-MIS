import bcrypt from 'bcrypt';
import config from '../config';
import { query } from '../db';

export const seedAdmin = async () => {
  const email = (config.admin.email || process.env.ADMIN_EMAIL || '')
    .trim()
    .toLowerCase();
  const rawPassword = config.admin.password || process.env.ADMIN_PASSWORD;
  const name = 'System Administrator';

  if (!email || !rawPassword) {
    console.warn(
      '⚠️ Admin seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD not configured.',
    );
    return;
  }

  try {
    // Check if admin already exists using parameterized SQL
    const checkRes = await query(
      `SELECT admin_id, email FROM admins WHERE email = $1`,
      [email],
    );

    if (checkRes.rows.length > 0) {
      // Admin already seeded
      return;
    }

    const saltRounds = Number(config.salt_rounds) || 12;
    const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

    const insertRes = await query(
      `INSERT INTO admins (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING admin_id, name, email, created_at`,
      [name, email, passwordHash],
    );

    console.log('Initial Admin seeded successfully into PostgreSQL:', {
      admin_id: insertRes.rows[0].admin_id,
      email: insertRes.rows[0].email,
    });
  } catch (error: any) {
    console.error(
      'Error seeding admin into PostgreSQL:',
      error.message || error,
    );
  }
};

if (require.main === module) {
  seedAdmin()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
