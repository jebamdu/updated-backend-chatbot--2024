import { Request, Response, NextFunction } from "express";
import { User } from "../utils/customInterfaces";

export default function authNsetUser(req: Request, res: Response, next: NextFunction) {
    const user: User = { id: 1, name: "moorthy", phno: "+916379482866" }// auth(req.headers)
    req.user = user;
    next()
}