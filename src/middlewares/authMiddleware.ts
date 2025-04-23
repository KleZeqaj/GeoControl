import { User as UserDTO } from "@dto/User";
import { UserType } from "@models/UserType";
import { processToken } from "@services/authService";
import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: UserDTO;
}

export function authenticateUser(allowedRoles: UserType[] = []) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      await processToken(req.headers.authorization, allowedRoles);
      next();
    } catch (error) {
      next(error);
    }
  };
}
