import "reflect-metadata";
import { DataSource } from "typeorm";
import { CONFIG } from "@config";
import { logError, logInfo } from "@services/loggingService";

export const AppDataSource = new DataSource({
  type: CONFIG.DB_TYPE as any,
  database: CONFIG.DB_NAME,
  entities: CONFIG.DB_ENTITIES,
  synchronize: true,
  logging: false,
  host: CONFIG.DB_HOST,
  port: CONFIG.DB_PORT,
  username: CONFIG.DB_USERNAME,
  password: CONFIG.DB_PASSWORD
});

export async function initializeDatabase() {
  await AppDataSource.initialize();
  logInfo("Successfully connected to DB");
}

export async function closeDatabase() {
  try {
    await AppDataSource.destroy();
    logInfo("Database connection closed.");
  } catch (error) {
    logError("Error while closing database:", error);
  }
}
