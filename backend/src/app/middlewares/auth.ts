/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import httpStatus from 'http-status';
import config from "../config";
import ApiError from "../errors/apiError";
import { jwtHelper } from "../utils/JwtHelper";

const auth = (...roles: string[]) => {
    return async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
        try {
            let token = req.cookies?.accessToken || req.headers.authorization || req.headers.token;

            if (!token) {
                throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
            }

            if (typeof token === 'string' && token.startsWith('Bearer ')) {
                token = token.split(' ')[1];
            }

            const secret = (config.jwt.accessToken || process.env.JWT_ACCESS_SECRET) as string;

            let user;
            try {
                user = jwtHelper.verifyToken(token, secret);
            } catch (error) {
                throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired token!");
            }

            if (!user) {
                throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
            }

            req.user = user;

            if (roles.length && !roles.includes(user.role)) {
                throw new ApiError(httpStatus.FORBIDDEN, "You don't have permission to access this resource!");
            }

            next();
        }
        catch (err) {
            next(err);
        }
    }
}

export default auth;

