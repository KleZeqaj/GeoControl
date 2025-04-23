import { User as UserDTO } from "@dto/User";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { Token as TokenDTO } from "@models/dto/Token";
import { UserRepository } from "@repositories/UserRepository";
import { generateToken } from "@services/authService";
import { createTokenDTO, createUserDTO } from "@services/mapperService";

export async function getToken(userDto: UserDTO): Promise<TokenDTO> {
  const userRepo = new UserRepository();
  const userDao = await userRepo.getUserByUsername(userDto.username);
  if (userDto.password !== userDao.password) {
    throw new UnauthorizedError("Invalid password");
  }
  return createTokenDTO(
    generateToken(
      createUserDTO(userDao.username, userDao.type, userDao.password)
    )
  );
}
