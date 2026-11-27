import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import config from '../../config';
import ApiError from '../../errors/apiError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthServices } from './auth.service';

const setAuthCookies = (
  req: Request,
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  const isSecure = Boolean(
    req.secure || req.headers['x-forwarded-proto'] === 'https',
  );

  res.cookie('accessToken', accessToken, {
    secure: isSecure,
    httpOnly: true,
    sameSite: isSecure ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });
  res.cookie('refreshToken', refreshToken, {
    secure: isSecure,
    httpOnly: true,
    sameSite: isSecure ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });
};

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.login(req.body);
  const { accessToken, refreshToken } = result;

  setAuthCookies(req, res, accessToken, refreshToken);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: 'Admin logged in successfully!',
    data: {
      accessToken,
      refreshToken,
    },
  });
});

/**
 * One-click login for the configured demo/admin account. The credentials are
 * read only from server-side environment variables and are passed through the
 * exact same login service, so this is a real admin login — no duplicated or
 * bypassed authentication, and no credentials shipped to the browser.
 */
const demoLogin = catchAsync(async (req: Request, res: Response) => {
  const email = config.demo.email?.trim().toLowerCase();
  const password = config.demo.password;

  if (!email || !password) {
    throw new ApiError(
      HttpStatus.SERVICE_UNAVAILABLE,
      'Demo login is not configured. Set DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD on the backend and restart the server.',
    );
  }

  let result;
  try {
    result = await AuthServices.login({ email, password });
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.statusCode === HttpStatus.UNAUTHORIZED
    ) {
      throw new ApiError(
        HttpStatus.SERVICE_UNAVAILABLE,
        'Demo account is not ready. Set DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD, then restart the backend to seed it.',
      );
    }
    throw error;
  }

  const { accessToken, refreshToken } = result;

  setAuthCookies(req, res, accessToken, refreshToken);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: 'Admin logged in successfully!',
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const getMe = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await AuthServices.getMe(req.user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: 'Admin profile retrieved successfully!',
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: 'User logged out successfully!',
    data: null,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: 'Check your email for reset password link!',
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = req.query.token as string;
  await AuthServices.resetPassword(token, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: 'Password reset successful!',
    data: null,
  });
});

export const AuthController = {
  login,
  demoLogin,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
};
