import { User as UserDTO } from "@dto/User";
import { UserRepository } from "@repositories/UserRepository";
import { mapUserDAOToDTO } from "@services/mapperService";

export async function getAllUsers(): Promise<UserDTO[]> {
  const userRepo = new UserRepository();
  return (await userRepo.getAllUsers()).map(mapUserDAOToDTO);
}

export async function getUser(username: string): Promise<UserDTO> {
  const userRepo = new UserRepository();
  return mapUserDAOToDTO(await userRepo.getUserByUsername(username));
}

export async function createUser(userDto: UserDTO): Promise<void> {
  const userRepo = new UserRepository();
  await userRepo.createUser(userDto.username, userDto.password, userDto.type);
}

export async function deleteUser(username: string): Promise<void> {
  const userRepo = new UserRepository();
  await userRepo.deleteUser(username);
}
