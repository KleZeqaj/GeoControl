import {
  initializeTestDataSource,
  closeTestDataSource
} from "@test/setup/test-datasource";
import { UserRepository } from "@repositories/UserRepository";
import { UserType } from "@models/UserType";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";

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

export const TEST_GATEWAYS = {
  gateway1: { macAddress: "AA:AA:AA:AA:AA:AA", name: "GW01", description: "Descrizione GW01" },
  gateway2: { macAddress: "BB:BB:BB:BB:BB:BB", name: "GW02", description: "Descrizione GW02" },
  gateway3: { macAddress: "CC:CC:CC:CC:CC:CC", name: "GW03", description: "Descrizione GW03" }
}

export const TEST_SENSORS = {
  sensor1: { macAddress: "DD:DD:DD:DD:DD:DD", name: "SENS01", description: "Descrizione SENS01", unit: "C", variable: "temperature" },
  sensor2: { macAddress: "EE:EE:EE:EE:EE:EE", name: "SENS02", description: "Descrizione SENS02", unit: "F", variable: "temperature" },
  sensor3: { macAddress: "FF:FF:FF:FF:FF:FF", name: "SENS03", description: "Descrizione SENS03", unit: "K", variable: "temperature" }
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
  const netDAO1 = await repoNetwork.createNewNetwork(
    TEST_NETWORKS.network1.code,
    TEST_NETWORKS.network1.name,
    TEST_NETWORKS.network1.description
  );
  const netDAO2 = await repoNetwork.createNewNetwork(
    TEST_NETWORKS.network2.code,
    TEST_NETWORKS.network2.name,
    TEST_NETWORKS.network2.description
  );
  const netDAO3 = await repoNetwork.createNewNetwork(
    TEST_NETWORKS.network3.code,
    TEST_NETWORKS.network3.name,
    TEST_NETWORKS.network3.description
  );

  // Create test data of gateway
  const repoGateway = new GatewayRepository();
  const gatDAO1 = await repoGateway.createGateway(
    TEST_GATEWAYS.gateway1.macAddress, 
    TEST_GATEWAYS.gateway1.name, 
    TEST_GATEWAYS.gateway1.description,
    netDAO1
  );
  const gatDAO2 = await repoGateway.createGateway(
    TEST_GATEWAYS.gateway2.macAddress, 
    TEST_GATEWAYS.gateway2.name, 
    TEST_GATEWAYS.gateway2.description,
    netDAO1
  );
  const gatDAO3 = await repoGateway.createGateway(
    TEST_GATEWAYS.gateway3.macAddress, 
    TEST_GATEWAYS.gateway3.name, 
    TEST_GATEWAYS.gateway3.description,
    netDAO1
  );

  // Create test data of sensor
  const sensorRepo = new SensorRepository();
  const sensDAO1 = await sensorRepo.createSensor(
    TEST_SENSORS.sensor1.macAddress,
    gatDAO1,
    TEST_SENSORS.sensor1.name,
    TEST_SENSORS.sensor1.description,
    TEST_SENSORS.sensor1.variable,
    TEST_SENSORS.sensor1.unit
  );
  const sensDAO2 = await sensorRepo.createSensor(
    TEST_SENSORS.sensor2.macAddress,
    gatDAO1,
    TEST_SENSORS.sensor2.name,
    TEST_SENSORS.sensor2.description,
    TEST_SENSORS.sensor2.variable,
    TEST_SENSORS.sensor2.unit
  );
  const sensDAO3 = await sensorRepo.createSensor(
    TEST_SENSORS.sensor3.macAddress,
    gatDAO1,
    TEST_SENSORS.sensor3.name,
    TEST_SENSORS.sensor3.description,
    TEST_SENSORS.sensor3.variable,
    TEST_SENSORS.sensor3.unit
  );
}

export async function afterAllE2e() {
  await closeTestDataSource();
}
