import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../config';
import { query } from '../../db';
import ApiError from '../../errors/apiError';
import emailSender from '../../utils/emailSender';
import { jwtHelper } from '../../utils/JwtHelper';

export interface AdminRow {
  admin_id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

const login = async (
  payload: { email: string; password: string },
  role: 'ADMIN' | 'DEMO' = 'ADMIN',
) => {
  // Query admin using parameterized PostgreSQL Raw SQL
  const result = await query(
    `SELECT admin_id, name, email, password_hash, created_at, updated_at
     FROM admins
     WHERE email = $1`,
    [payload.email.toLowerCase().trim()]
  );

  const admin: AdminRow | undefined = result.rows[0];

  if (!admin || !admin.password_hash) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
  }

  // Verify password using existing bcrypt configuration
  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    admin.password_hash
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
  }

  // Generate tokens with the admin identity. Normal logins are ADMIN; the
  // dedicated demo account is issued a read-only DEMO role.
  const tokenPayload = {
    userId: admin.admin_id.toString(),
    adminId: admin.admin_id.toString(),
    email: admin.email,
    role,
  };

  const accessToken = jwtHelper.generateToken(
    tokenPayload,
    config.jwt.accessToken as Secret,
    config.jwt.accessTokenExpiresIn as string
  );

  const refreshToken = jwtHelper.generateToken(
    tokenPayload,
    config.jwt.refreshToken as Secret,
    config.jwt.refreshTokenExpiresIn as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

const getMe = async (userPayload: {
  userId?: string;
  adminId?: string;
  email?: string;
  role?: string;
}) => {
  let result;
  if (userPayload.adminId || userPayload.userId) {
    result = await query(
      `SELECT admin_id, name, email, created_at, updated_at
       FROM admins
       WHERE admin_id = $1`,
      [userPayload.adminId || userPayload.userId]
    );
  } else if (userPayload.email) {
    result = await query(
      `SELECT admin_id, name, email, created_at, updated_at
       FROM admins
       WHERE email = $1`,
      [userPayload.email.toLowerCase().trim()]
    );
  }

  const admin = result?.rows[0];
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  }

  // Return clean admin profile with role - NEVER exposes password_hash
  return {
    id: admin.admin_id.toString(),
    admin_id: admin.admin_id.toString(),
    name: admin.name,
    email: admin.email,
    role: userPayload.role || 'ADMIN',
    created_at: admin.created_at,
    updated_at: admin.updated_at,
  };
};

const forgotPassword = async (payload: { email: string }) => {
  const result = await query(
    `SELECT admin_id, name, email FROM admins WHERE email = $1`,
    [payload.email.toLowerCase().trim()]
  );

  const admin = result.rows[0];
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  }

  const resetToken = jwtHelper.generateToken(
    {
      id: admin.admin_id.toString(),
      adminId: admin.admin_id.toString(),
      email: admin.email,
      role: 'ADMIN',
    },
    config.jwt.reset_pass_secret as Secret,
    config.jwt.reset_pass_token_expires_in as string
  );

  const resetLink = `${config.reset_pass_link}?token=${resetToken}`;

  await emailSender(
    'Reset Your Password',
    admin.email,
    `
        <p>Hello ${admin.name || 'Admin'},</p>
        <p>Click the link below to reset your password:</p>
         <a href="${resetLink}" style="text-decoration: none;">
            <button style="background-color: #007BFF; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">
              Reset Password
            </button>
          </a>
        <p>If you didn't request this, ignore this email.</p>
        `
  );

  return { message: 'Reset password email sent' };
};

const resetPassword = async (token: string, payload: { password: string }) => {
  const decoded = jwtHelper.verifyToken(
    token,
    config.jwt.reset_pass_secret as Secret
  );

  if (!decoded || !decoded.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Invalid or expired token!');
  }

  const result = await query(
    `SELECT admin_id FROM admins WHERE admin_id = $1`,
    [decoded.id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.salt_rounds) || 12
  );

  await query(
    `UPDATE admins
     SET password_hash = $1, updated_at = NOW()
     WHERE admin_id = $2`,
    [hashedPassword, decoded.id]
  );

  return { message: 'Password reset successful' };
};

export const AuthServices = {
  login,
  getMe,
  forgotPassword,
  resetPassword,
};
