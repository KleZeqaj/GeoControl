import { updateSensorService } from "@services/sensorService";
import { SensorRepository } from "@repositories/SensorRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { ConflictError } from "@models/errors/ConflictError";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(NetworkDAO).clear();
  await TestDataSource.getRepository(GatewayDAO).clear();
  await TestDataSource.getRepository(SensorDAO).clear();
});

describe("SensorService: SQLite in-memory", () => {
    const SensorRepo = new SensorRepository();
    const GatewayRepo = new GatewayRepository();
    const NetworkRepo = new NetworkRepository();

  it("update sensor", async () => {
    const netDAO = new NetworkDAO();
    netDAO.code = "NET01";
    netDAO.description = "Descrizione rete1";
    netDAO.name = "Rete1";

    const net = await NetworkRepo.createNewNetwork(netDAO.code, netDAO.name, netDAO.description);
    expect(net).toMatchObject({
        code: netDAO.code,
        description: netDAO.description,
        name: netDAO.name
    });

    const gatewayDAO = new GatewayDAO();
    gatewayDAO.network = netDAO;
    gatewayDAO.macAddress = "AA:AA:AA:AA:AA:AA";
    gatewayDAO.name = "GW01";
    gatewayDAO.description = "Descrizione GW01";

    const gat = await GatewayRepo.createGateway(gatewayDAO.macAddress, gatewayDAO.name, gatewayDAO.description, gatewayDAO.network);
    expect(gat).toMatchObject({
        macAddress: gatewayDAO.macAddress,
        name: gatewayDAO.name,
        description: gatewayDAO.description
    });

    const sensorDAO1 = new SensorDAO();
    sensorDAO1.gateway = gatewayDAO;
    sensorDAO1.macAddress = "BB:BB:BB:BB:BB:BB";
    sensorDAO1.name = "SENS01";
    sensorDAO1.description = "Descrizione SENS01";
    sensorDAO1.unit = "C";
    sensorDAO1.variable = "temperature";

    const sens1 = await SensorRepo.createSensor(sensorDAO1.macAddress, sensorDAO1.gateway, sensorDAO1.name, sensorDAO1.description, sensorDAO1.variable, sensorDAO1.unit);
    expect(sens1).toMatchObject({
        macAddress: sensorDAO1.macAddress,
        name: sensorDAO1.name,
        description: sensorDAO1.description,
        unit: sensorDAO1.unit,
        variable: sensorDAO1.variable
    })

    const sensorDAO2 = new SensorDAO();
    sensorDAO2.gateway = gatewayDAO;
    sensorDAO2.macAddress = "BB:BB:BB:BB:BB:BC";
    sensorDAO2.name = "SENS02";
    sensorDAO2.description = "Descrizione SENS02";
    sensorDAO2.unit = "C";
    sensorDAO2.variable = "temperature";

    const sens2 = await SensorRepo.createSensor(sensorDAO2.macAddress, sensorDAO2.gateway, sensorDAO2.name, sensorDAO2.description, sensorDAO2.variable, sensorDAO2.unit);
    expect(sens2).toMatchObject({
        macAddress: sensorDAO2.macAddress,
        name: sensorDAO2.name,
        description: sensorDAO2.description,
        unit: sensorDAO2.unit,
        variable: sensorDAO2.variable
    })

    sensorDAO2.macAddress = "BB:BB:BB:BB:BB:FF";
    sensorDAO2.name = "New SENS02";

    await updateSensorService(netDAO.code, gatewayDAO.macAddress, sens2.macAddress, sensorDAO2);

    const result = await SensorRepo.getSensorByMacAddress(sensorDAO2.macAddress);
    expect(result).toMatchObject({
        macAddress: sensorDAO2.macAddress,
        name: sensorDAO2.name,
        description: sensorDAO2.description,
        unit: sensorDAO2.unit,
        variable: sensorDAO2.variable
    })
  });

  it("update sensor: every not found error", async () => {
    const netDAO = new NetworkDAO();
    netDAO.code = "NET01";
    netDAO.description = "Descrizione rete1";
    netDAO.name = "Rete1";

    const net = await NetworkRepo.createNewNetwork(netDAO.code, netDAO.name, netDAO.description);
    expect(net).toMatchObject({
        code: netDAO.code,
        description: netDAO.description,
        name: netDAO.name
    });

    const gatewayDAO = new GatewayDAO();
    gatewayDAO.network = netDAO;
    gatewayDAO.macAddress = "AA:AA:AA:AA:AA:AA";
    gatewayDAO.name = "GW01";
    gatewayDAO.description = "Descrizione GW01";

    const gat = await GatewayRepo.createGateway(gatewayDAO.macAddress, gatewayDAO.name, gatewayDAO.description, gatewayDAO.network);
    expect(gat).toMatchObject({
        macAddress: gatewayDAO.macAddress,
        name: gatewayDAO.name,
        description: gatewayDAO.description
    });

    const sensorDAO1 = new SensorDAO();
    sensorDAO1.gateway = gatewayDAO;
    sensorDAO1.macAddress = "BB:BB:BB:BB:BB:BB";
    sensorDAO1.name = "SENS01";
    sensorDAO1.description = "Descrizione SENS01";
    sensorDAO1.unit = "C";
    sensorDAO1.variable = "temperature";

    const sens1 = await SensorRepo.createSensor(sensorDAO1.macAddress, sensorDAO1.gateway, sensorDAO1.name, sensorDAO1.description, sensorDAO1.variable, sensorDAO1.unit);
    expect(sens1).toMatchObject({
        macAddress: sensorDAO1.macAddress,
        name: sensorDAO1.name,
        description: sensorDAO1.description,
        unit: sensorDAO1.unit,
        variable: sensorDAO1.variable
    })

    await expect(updateSensorService("NET05", gatewayDAO.macAddress, sens1.macAddress, sensorDAO1)).rejects.toThrow(NotFoundError);
    await expect(updateSensorService(netDAO.code, "DD:DD:DD:DD:DD:DD", sens1.macAddress, sensorDAO1)).rejects.toThrow(NotFoundError);
    await expect(updateSensorService(netDAO.code, gatewayDAO.macAddress, "AB:AB:AB:AB:AB:AB", sensorDAO1)).rejects.toThrow(NotFoundError);
  });

  it("update sensor: conflict error", async () => {
    const netDAO = new NetworkDAO();
    netDAO.code = "NET01";
    netDAO.description = "Descrizione rete1";
    netDAO.name = "Rete1";

    const net = await NetworkRepo.createNewNetwork(netDAO.code, netDAO.name, netDAO.description);
    expect(net).toMatchObject({
        code: netDAO.code,
        description: netDAO.description,
        name: netDAO.name
    });

    const gatewayDAO = new GatewayDAO();
    gatewayDAO.network = netDAO;
    gatewayDAO.macAddress = "AA:AA:AA:AA:AA:AA";
    gatewayDAO.name = "GW01";
    gatewayDAO.description = "Descrizione GW01";

    const gat = await GatewayRepo.createGateway(gatewayDAO.macAddress, gatewayDAO.name, gatewayDAO.description, gatewayDAO.network);
    expect(gat).toMatchObject({
        macAddress: gatewayDAO.macAddress,
        name: gatewayDAO.name,
        description: gatewayDAO.description
    });

    const sensorDAO1 = new SensorDAO();
    sensorDAO1.gateway = gatewayDAO;
    sensorDAO1.macAddress = "BB:BB:BB:BB:BB:BB";
    sensorDAO1.name = "SENS01";
    sensorDAO1.description = "Descrizione SENS01";
    sensorDAO1.unit = "C";
    sensorDAO1.variable = "temperature";

    const sens1 = await SensorRepo.createSensor(sensorDAO1.macAddress, sensorDAO1.gateway, sensorDAO1.name, sensorDAO1.description, sensorDAO1.variable, sensorDAO1.unit);
    expect(sens1).toMatchObject({
        macAddress: sensorDAO1.macAddress,
        name: sensorDAO1.name,
        description: sensorDAO1.description,
        unit: sensorDAO1.unit,
        variable: sensorDAO1.variable
    })

    const sensorDAO2 = new SensorDAO();
    sensorDAO2.gateway = gatewayDAO;
    sensorDAO2.macAddress = "BB:BB:BB:BB:BB:BC";
    sensorDAO2.name = "SENS02";
    sensorDAO2.description = "Descrizione SENS02";
    sensorDAO2.unit = "C";
    sensorDAO2.variable = "temperature";

    const sens2 = await SensorRepo.createSensor(sensorDAO2.macAddress, sensorDAO2.gateway, sensorDAO2.name, sensorDAO2.description, sensorDAO2.variable, sensorDAO2.unit);
    expect(sens2).toMatchObject({
        macAddress: sensorDAO2.macAddress,
        name: sensorDAO2.name,
        description: sensorDAO2.description,
        unit: sensorDAO2.unit,
        variable: sensorDAO2.variable
    })

    sensorDAO2.macAddress = "BB:BB:BB:BB:BB:BB";
    sensorDAO2.name = "New SENS02";

    await expect(updateSensorService(netDAO.code, gatewayDAO.macAddress, sens2.macAddress, sensorDAO2)).rejects.toThrow(ConflictError);
  });

});
