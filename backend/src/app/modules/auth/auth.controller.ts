import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthServices } from './auth.service';

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.login(req.body);
  const { accessToken, refreshToken } = result;

  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

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
  getMe,
  logout,
  forgotPassword,
  resetPassword,
};
