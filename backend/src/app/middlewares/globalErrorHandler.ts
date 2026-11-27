/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import config from "../config";

const globalErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (config.node_env === "development") {
        console.log("server error", err);
    }

    let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    let message = err.message || "Something went wrong!";
    let error = err;
    const success = false;

    // PostgreSQL database errors (via pg)
    if (err.code) {
        // Unique violation
        if (err.code === "23505") {
            statusCode = httpStatus.CONFLICT;
            message = "Duplicate key error: Unique constraint violation";
            error = { detail: err.detail, table: err.table };
        }
        // Foreign key violation
        else if (err.code === "23503") {
            statusCode = httpStatus.BAD_REQUEST;
            message = "Foreign key constraint failed";
            error = { detail: err.detail, table: err.table };
        }
        // Check violation
        else if (err.code === "23514") {
            statusCode = httpStatus.BAD_REQUEST;
            message = "Check constraint violation";
            error = { detail: err.detail, table: err.table };
        }
        // Not null violation
        else if (err.code === "23502") {
            statusCode = httpStatus.BAD_REQUEST;
            message = `Missing required column: ${err.column}`;
            error = { column: err.column, table: err.table };
        }
    }

    // Zod error (SAFE)
    else if (err?.name === "ZodError" && Array.isArray(err?.issues)) {
        statusCode = httpStatus.BAD_REQUEST;
        message = err.issues.map((i: any) => i.message).join(", ");
        error = err.issues;
    }

    res.status(statusCode).json({
        success,
        message,
        error,
        // Line-level errors from bulk operations (e.g. CSV upload rows)
        ...(Array.isArray(err?.errors) ? { errors: err.errors } : {}),
    });
};

export default globalErrorHandler;
