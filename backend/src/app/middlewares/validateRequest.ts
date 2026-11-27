import { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";

const validateRequest = (schema: ZodObject) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Schemas are declared as { body: {...} } while controllers read the
        // flat req.body, so validate against the wrapper shape.
        await schema.parseAsync({ body: req.body })
        return next();
    } catch (err) {
        next(err)
    }
};

export default validateRequest;