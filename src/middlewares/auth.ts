import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const isAuth = (req: Request, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization?.split(" ")[1];
  if (!bearer) {
    return res.status(401).json({ msg: "No autorizado" });
  }
  try {
    req.user = jwt.verify(bearer, process.env.JWT_SECRET!);
    next();
  } catch {
    res.status(401).json({ msg: "No autorizado" });
  }
};