import jwt from "jsonwebtoken";
import { SECRET_KEY, TOKEN_LIFESPAN } from "@config";
import { User as UserDTO } from "@dto/User";
import { UserType } from "@models/UserType";
import { UserRepository } from "@repositories/UserRepository";
import { UserDAO } from "@dao/UserDAO";
import AppError from "@models/errors/AppError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";

export function generateToken(user: UserDTO): string {
  return jwt.sign(user, SECRET_KEY, { expiresIn: TOKEN_LIFESPAN });
}

export async function processToken(
  authHeader?: string,
  allowedRoles: UserType[] = []
) {
  const user: UserDTO = verifyToken(authHeader);
  const userRepo = new UserRepository();
  let userDAO: UserDAO;
  try {
    userDAO = await userRepo.getUserByUsername(user.username);
  } catch (error) {
    throw new UnauthorizedError(
      `Unauthorized: user ${user.username} not found`
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userDAO.type)) {
    throw new InsufficientRightsError("Forbidden: Insufficient rights");
  }
}

function verifyToken(authHeader?: string): UserDTO {
  try {
    return jwt.verify(extractBearerToken(authHeader), SECRET_KEY) as UserDTO;
  } catch (error) {
    throw error instanceof AppError
      ? error
      : new UnauthorizedError(`Unauthorized: ${error.message}`);
  }
}

function extractBearerToken(authHeader?: string): string {
  if (!authHeader) {
    throw new UnauthorizedError("Unauthorized: No token provided");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new UnauthorizedError("Unauthorized: Invalid token format");
  }

  return parts[1];
}
