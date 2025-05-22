import {
  initializeTestDataSource,
  closeTestDataSource
} from "@test/setup/test-datasource";
import { UserRepository } from "@repositories/UserRepository";
import { UserType } from "@models/UserType";
import { NetworkRepository } from "@repositories/NetworkRepository";

export const TEST_USERS = {
  admin: { username: "admin", password: "adminpass", type: UserType.Admin },
  operator: {
    username: "operator",
    password: "operatorpass",
    type: UserType.Operator
  },
  viewer: { username: "viewer", password: "viewerpass", type: UserType.Viewer }
};

export const TEST_NETWORKS = {
  network1: { code: "NET01", name: "Network 1", description: "Test Network 1" },
  network2: { code: "NET02", name: "Network 2", description: "Test Network 2" },
  network3: { code: "NET03", name: "Network 3", description: "Test Network 3" }
}

export async function beforeAllE2e() {
  await initializeTestDataSource();

  // Create test data of user
  const repoUser = new UserRepository();
  await repoUser.createUser(
    TEST_USERS.admin.username,
    TEST_USERS.admin.password,
    TEST_USERS.admin.type
  );
  await repoUser.createUser(
    TEST_USERS.operator.username,
    TEST_USERS.operator.password,
    TEST_USERS.operator.type
  );
  await repoUser.createUser(
    TEST_USERS.viewer.username,
    TEST_USERS.viewer.password,
    TEST_USERS.viewer.type
  );

  // Create test data of network
  const repoNetwork = new NetworkRepository();
  await repoNetwork.createNewNetwork(
    TEST_NETWORKS.network1.code,
    TEST_NETWORKS.network1.name,
    TEST_NETWORKS.network1.description
  );
  await repoNetwork.createNewNetwork(
    TEST_NETWORKS.network2.code,
    TEST_NETWORKS.network2.name,
    TEST_NETWORKS.network2.description
  );
  await repoNetwork.createNewNetwork(
    TEST_NETWORKS.network3.code,
    TEST_NETWORKS.network3.name,
    TEST_NETWORKS.network3.description
  );
}
export async function afterAllE2e() {
  await closeTestDataSource();
}
