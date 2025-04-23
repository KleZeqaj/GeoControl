import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { UserDAO } from "@dao/UserDAO";
import { UserType } from "@models/UserType";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";

export class UserRepository {
  private repo: Repository<UserDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(UserDAO);
  }

  getAllUsers(): Promise<UserDAO[]> {
    return this.repo.find();
  }

  async getUserByUsername(username: string): Promise<UserDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { username } }),
      () => true,
      `User with username '${username}' not found`
    );
  }

  async createUser(
    username: string,
    password: string,
    userType: UserType
  ): Promise<UserDAO> {
    throwConflictIfFound(
      await this.repo.find({ where: { username } }),
      () => true,
      `User with username '${username}' already exists`
    );

    return this.repo.save({
      username: username,
      password: password,
      type: userType
    });
  }

  async deleteUser(username: string): Promise<void> {
    await this.repo.remove(await this.getUserByUsername(username));
  }
}
