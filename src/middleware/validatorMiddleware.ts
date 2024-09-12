import { ValidateFunction } from "ajv"
import { Request, Response, NextFunction } from "express"

export default function validatorMiddleware(validator: ValidateFunction) {

    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const valid = validator(req.body);
            if (!valid) {
                return res.json({ status: 400, errors: validator.errors, message: "JSON Schema validation failed" })
            }
            next()
        } catch (error) {
            return res.json({ status: 400, errors: error, message: "JSON Schema validation failed" })
        }
    }
}