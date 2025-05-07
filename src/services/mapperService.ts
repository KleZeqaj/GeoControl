import { Network as NetworkDTO } from "@dto/Network";
import { Token as TokenDTO } from "@dto/Token";
import { User as UserDTO } from "@dto/User";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { UserDAO } from "@models/dao/UserDAO";
import { ErrorDTO } from "@models/dto/ErrorDTO";
import { Gateway } from "@models/dto/Gateway";
import { UserType } from "@models/UserType";

export function createErrorDTO(
  code: number,
  message?: string,
  name?: string
): ErrorDTO {
  return removeNullAttributes({
    code,
    name,
    message
  }) as ErrorDTO;
}

export function createTokenDTO(token: string): TokenDTO {
  return removeNullAttributes({
    token: token
  }) as TokenDTO;
}

export function createUserDTO(
  username: string,
  type: UserType,
  password?: string
): UserDTO {
  return removeNullAttributes({
    username,
    type,
    password
  }) as UserDTO;
}

export function mapUserDAOToDTO(userDAO: UserDAO): UserDTO {
  return createUserDTO(userDAO.username, userDAO.type);
}

function removeNullAttributes<T>(dto: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(dto).filter(
      ([_, value]) =>
        value !== null &&
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0)
    )
  ) as Partial<T>;
}

// NETWORK
export function createNetworkDTO(code: string, name?: string, description?: string,  gateways?: Array<Gateway>) : NetworkDTO {
  return removeNullAttributes({code, name, description, gateways}) as NetworkDTO;
}


export function mapNetworkDAOToDTO(networkDAO: NetworkDAO): NetworkDTO{
  return createNetworkDTO(networkDAO.code, networkDAO.name, networkDAO.description, []);
}
