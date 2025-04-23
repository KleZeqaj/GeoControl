import { UserRepository } from "@repositories/UserRepository";
import { UserType } from "@models/UserType";
import { AppDataSource, initializeDatabase } from "@database";
import { logError, logInfo, logWarn } from "@services/loggingService";

async function waitForDatabaseConnection(
  retries = 10,
  delay = 2000
): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await initializeDatabase();
      logInfo("Database connection established.");
      return true;
    } catch (err) {
      logWarn(
        `Database not ready (${i + 1}/${retries}), retrying in ${delay}ms...`
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  logError("Unable to connect to the database after multiple retries.");
  return false;
}

export async function createRootUser() {
  const dbReady = await waitForDatabaseConnection();

  if (!dbReady) return;

  try {
    const userRepo = new UserRepository();
    const existingUser = await userRepo
      .getUserByUsername("root")
      .catch(() => null);

    if (existingUser) {
      logWarn("Root user already exists.");
    } else {
      await userRepo.createUser("root", "rootpassword", UserType.Admin);
      logInfo("Root user created successfully.");
    }
  } catch (error) {
    logError("Error creating root user:", error);
  } finally {
    try {
      await AppDataSource.destroy();
      logInfo("Database connection closed.");
    } catch (err) {
      logWarn(`Error closing database connection: ${err}`);
    }
  }
}

createRootUser();
