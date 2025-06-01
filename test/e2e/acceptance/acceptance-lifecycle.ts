import {
  initializeTestDataSource,
  closeTestDataSource
} from "@test/setup/test-datasource";
import { UserRepository } from "@repositories/UserRepository";
import { UserType } from "@models/UserType";

export const TEST_USERS = {
  admin: { username: "admin", password: "adminpass", type: UserType.Admin },
  operator: {
    username: "operator",
    password: "operatorpass",
    type: UserType.Operator
  },
  viewer: { username: "viewer", password: "viewerpass", type: UserType.Viewer }
};

export async function beforeAllE2e() {
  await initializeTestDataSource();
  const repo = new UserRepository();
  await repo.createUser(
    TEST_USERS.admin.username,
    TEST_USERS.admin.password,
    TEST_USERS.admin.type
  );
  await repo.createUser(
    TEST_USERS.operator.username,
    TEST_USERS.operator.password,
    TEST_USERS.operator.type
  );
  await repo.createUser(
    TEST_USERS.viewer.username,
    TEST_USERS.viewer.password,
    TEST_USERS.viewer.type
  );
}
export async function afterAllE2e() {
  await closeTestDataSource();
}
