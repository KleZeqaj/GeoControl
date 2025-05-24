import { 
    getAllSensors,
    getSensor,
    createSensor,
    deleteSensor,
    updateSensor
 } from "@controllers/sensorController";
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
import { mapSensorDAOToDTO } from "@services/mapperService";

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

describe("SensorController: SQLite in-memory", () => {
    const SensorRepo = new SensorRepository();
    const GatewayRepo = new GatewayRepository();
    const NetworkRepo = new NetworkRepository();

  it("get all sensors", async () => {
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

    const result = await getAllSensors(netDAO.code, gatewayDAO.macAddress);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    result.forEach(el => {expect(el).not.toHaveProperty("id");});
    expect(result[0]).toMatchObject({
        macAddress: sensorDAO1.macAddress,
        name: sensorDAO1.name,
        description: sensorDAO1.description,
        variable: sensorDAO1.variable,
        unit: sensorDAO1.unit
    });
    expect(result[1]).toMatchObject({
        macAddress: sensorDAO2.macAddress,
        name: sensorDAO2.name,
        description: sensorDAO2.description,
        variable: sensorDAO2.variable,
        unit: sensorDAO2.unit
    })
  });

  it("get all sensors: not found errors", async () => {

    const netCode = "NET01";
    const gatMac = "AA:AA:AA:AA:AA:AA";

    await expect(getAllSensors(netCode, gatMac)).rejects.toThrow(NotFoundError);

    const netDAO = new NetworkDAO();
    netDAO.code = netCode;
    netDAO.description = "Descrizione rete1";
    netDAO.name = "Rete1";

    const net = await NetworkRepo.createNewNetwork(netDAO.code, netDAO.name, netDAO.description);
    expect(net).toMatchObject({
        code: netDAO.code,
        description: netDAO.description,
        name: netDAO.name
    });

    await expect(getAllSensors(netCode, gatMac)).rejects.toThrow(NotFoundError);

    const gatewayDAO = new GatewayDAO();
    gatewayDAO.network = netDAO;
    gatewayDAO.macAddress = gatMac;
    gatewayDAO.name = "GW01";
    gatewayDAO.description = "Descrizione GW01";

    const gat = await GatewayRepo.createGateway(gatewayDAO.macAddress, gatewayDAO.name, gatewayDAO.description, gatewayDAO.network);
    expect(gat).toMatchObject({
        macAddress: gatewayDAO.macAddress,
        name: gatewayDAO.name,
        description: gatewayDAO.description
    });

    await expect(getAllSensors(netCode, gatMac)).resolves.toBeDefined();
  });

  it("get sensor", async () => {
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

    const result = await getSensor(netDAO.code, gatewayDAO.macAddress, sensorDAO1.macAddress);
    expect(result).not.toHaveProperty("id");
    expect(result).toMatchObject({
        macAddress: sensorDAO1.macAddress,
        name: sensorDAO1.name,
        description: sensorDAO1.description,
        variable: sensorDAO1.variable,
        unit: sensorDAO1.unit
    });
  });

  it("get sensor: every not found errors", async () => {

    const netCode = "NET01";
    const gatMac = "AA:AA:AA:AA:AA:AA";

    await expect(getAllSensors(netCode, gatMac)).rejects.toThrow(NotFoundError);

    const netDAO = new NetworkDAO();
    netDAO.code = netCode;
    netDAO.description = "Descrizione rete1";
    netDAO.name = "Rete1";

    const net = await NetworkRepo.createNewNetwork(netDAO.code, netDAO.name, netDAO.description);
    expect(net).toMatchObject({
        code: netDAO.code,
        description: netDAO.description,
        name: netDAO.name
    });

    await expect(getAllSensors(netCode, gatMac)).rejects.toThrow(NotFoundError);

    const gatewayDAO = new GatewayDAO();
    gatewayDAO.network = netDAO;
    gatewayDAO.macAddress = gatMac;
    gatewayDAO.name = "GW01";
    gatewayDAO.description = "Descrizione GW01";

    const gat = await GatewayRepo.createGateway(gatewayDAO.macAddress, gatewayDAO.name, gatewayDAO.description, gatewayDAO.network);
    expect(gat).toMatchObject({
        macAddress: gatewayDAO.macAddress,
        name: gatewayDAO.name,
        description: gatewayDAO.description
    });

    await expect(getSensor(netCode, gatMac, "CC:CC:CC:CC:CC:CC")).rejects.toThrow(NotFoundError);
  });

  it("create sensor", async () => {
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

    await createSensor(netDAO.code, gatewayDAO.macAddress, mapSensorDAOToDTO(sensorDAO1));

    const result = await SensorRepo.getSensorByMacAddress(sensorDAO1.macAddress);
    expect(result).toMatchObject({
        macAddress: sensorDAO1.macAddress,
        name: sensorDAO1.name,
        description: sensorDAO1.description,
        variable: sensorDAO1.variable,
        unit: sensorDAO1.unit
    });
  });

  it("create sensor: all not found errors", async () => {

    const sensorDAO1 = new SensorDAO();
    sensorDAO1.macAddress = "BB:BB:BB:BB:BB:BB";
    sensorDAO1.name = "SENS01";
    sensorDAO1.description = "Descrizione SENS01";
    sensorDAO1.unit = "C";
    sensorDAO1.variable = "temperature";

    const netCode = "NET01";
    const gatMac = "AA:AA:AA:AA:AA:AA";

    await expect(createSensor(netCode, gatMac, mapSensorDAOToDTO(sensorDAO1))).rejects.toThrow(NotFoundError);

    const netDAO = new NetworkDAO();
    netDAO.code = netCode;
    netDAO.description = "Descrizione rete1";
    netDAO.name = "Rete1";

    const net = await NetworkRepo.createNewNetwork(netDAO.code, netDAO.name, netDAO.description);
    expect(net).toMatchObject({
        code: netDAO.code,
        description: netDAO.description,
        name: netDAO.name
    });

    await expect(createSensor(netCode, gatMac, mapSensorDAOToDTO(sensorDAO1))).rejects.toThrow(NotFoundError);
  });

  it("create sensor: conflicting macAddress", async () => {
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

    await createSensor(netDAO.code, gatewayDAO.macAddress, mapSensorDAOToDTO(sensorDAO1));

    const result = await SensorRepo.getSensorByMacAddress(sensorDAO1.macAddress);
    expect(result).toMatchObject({
        macAddress: sensorDAO1.macAddress,
        name: sensorDAO1.name,
        description: sensorDAO1.description,
        variable: sensorDAO1.variable,
        unit: sensorDAO1.unit
    });

    const sensorDAO2 = new SensorDAO();
    sensorDAO1.gateway = gatewayDAO;
    sensorDAO1.macAddress = "BB:BB:BB:BB:BB:BB";
    sensorDAO1.name = "SENS02";
    sensorDAO1.description = "Descrizione SENS02";
    sensorDAO1.unit = "F";
    sensorDAO1.variable = "temperature";

    await expect(createSensor(netDAO.code, gatewayDAO.macAddress, mapSensorDAOToDTO(sensorDAO2))).rejects.toThrow(ConflictError);
  });

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

    await createSensor(netDAO.code, gatewayDAO.macAddress, mapSensorDAOToDTO(sensorDAO1));

    const result = await SensorRepo.getSensorByMacAddress(sensorDAO1.macAddress);
    expect(result).toMatchObject({
        macAddress: sensorDAO1.macAddress,
        name: sensorDAO1.name,
        description: sensorDAO1.description,
        variable: sensorDAO1.variable,
        unit: sensorDAO1.unit
    });

    sensorDAO1.macAddress = "FF:FF:FF:FF:FF:FF";

    await updateSensor(netDAO.code, gatewayDAO.macAddress, "BB:BB:BB:BB:BB:BB", mapSensorDAOToDTO(sensorDAO1));

    const result2 = await SensorRepo.getSensorByMacAddress(sensorDAO1.macAddress);
    expect(result2).toMatchObject({
        macAddress: sensorDAO1.macAddress,
        name: sensorDAO1.name,
        description: sensorDAO1.description,
        variable: sensorDAO1.variable,
        unit: sensorDAO1.unit
    });
  });

  it("update sensor: all not found errors", async () => {

    const sensorDAO1 = new SensorDAO();
    sensorDAO1.macAddress = "BB:BB:BB:BB:BB:BB";
    sensorDAO1.name = "SENS01";
    sensorDAO1.description = "Descrizione SENS01";
    sensorDAO1.unit = "C";
    sensorDAO1.variable = "temperature";

    const netCode = "NET01";
    const gatMac = "AA:AA:AA:AA:AA:AA";

    await expect(updateSensor(netCode, gatMac, sensorDAO1.macAddress,mapSensorDAOToDTO(sensorDAO1))).rejects.toThrow(NotFoundError);

    const netDAO = new NetworkDAO();
    netDAO.code = netCode;
    netDAO.description = "Descrizione rete1";
    netDAO.name = "Rete1";

    const net = await NetworkRepo.createNewNetwork(netDAO.code, netDAO.name, netDAO.description);
    expect(net).toMatchObject({
        code: netDAO.code,
        description: netDAO.description,
        name: netDAO.name
    });

    await expect(updateSensor(netCode, gatMac, sensorDAO1.macAddress,mapSensorDAOToDTO(sensorDAO1))).rejects.toThrow(NotFoundError);

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

    await expect(updateSensor(netCode, gatMac, sensorDAO1.macAddress,mapSensorDAOToDTO(sensorDAO1))).rejects.toThrow(NotFoundError);
  });

  it("update sensor: conflicting macAddress", async () => {
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

    await createSensor(netDAO.code, gatewayDAO.macAddress, mapSensorDAOToDTO(sensorDAO1));

    const result = await SensorRepo.getSensorByMacAddress(sensorDAO1.macAddress);
    expect(result).toMatchObject({
        macAddress: sensorDAO1.macAddress,
        name: sensorDAO1.name,
        description: sensorDAO1.description,
        variable: sensorDAO1.variable,
        unit: sensorDAO1.unit
    });

    await updateSensor(netDAO.code, gatewayDAO.macAddress, sensorDAO1.macAddress, mapSensorDAOToDTO(sensorDAO1));

    const result2 = await SensorRepo.getSensorByMacAddress(sensorDAO1.macAddress);
    expect(result2).toMatchObject({
        macAddress: sensorDAO1.macAddress,
        name: sensorDAO1.name,
        description: sensorDAO1.description,
        variable: sensorDAO1.variable,
        unit: sensorDAO1.unit
    });

    const sensorDAO2 = new SensorDAO();
    sensorDAO2.gateway = gatewayDAO;
    sensorDAO2.macAddress = "FF:FF:FF:FF:FF:FF";
    sensorDAO2.name = "SENS02";
    sensorDAO2.description = "Descrizione SENS02";
    sensorDAO2.unit = "C";
    sensorDAO2.variable = "temperature";

    await createSensor(netDAO.code, gatewayDAO.macAddress, mapSensorDAOToDTO(sensorDAO2));

    sensorDAO2.macAddress = sensorDAO1.macAddress;

    await expect(updateSensor(netDAO.code, gatewayDAO.macAddress, "FF:FF:FF:FF:FF:FF", mapSensorDAOToDTO(sensorDAO2))).rejects.toThrow(ConflictError);
  });

  it("delete sensor", async () => {
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

    await createSensor(netDAO.code, gatewayDAO.macAddress, mapSensorDAOToDTO(sensorDAO1));

    const result = await SensorRepo.getSensorByMacAddress(sensorDAO1.macAddress);
    expect(result).toMatchObject({
        macAddress: sensorDAO1.macAddress,
        name: sensorDAO1.name,
        description: sensorDAO1.description,
        variable: sensorDAO1.variable,
        unit: sensorDAO1.unit
    });

    await deleteSensor(netDAO.code, gatewayDAO.macAddress, sensorDAO1.macAddress);

    await expect(SensorRepo.getSensorByMacAddress(sensorDAO1.macAddress)).rejects.toThrow(NotFoundError);

  });

  it("delete sensor: all not found errors", async () => {

    await expect(deleteSensor("NET01", "AA:AA:AA:AA:AA:AA", "BB:BB:BB:BB:BB:BB")).rejects.toThrow(NotFoundError);

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

    await expect(deleteSensor("NET01", "AA:AA:AA:AA:AA:AA", "BB:BB:BB:BB:BB:BB")).rejects.toThrow(NotFoundError);

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

    await expect(deleteSensor("NET01", "AA:AA:AA:AA:AA:AA", "BB:BB:BB:BB:BB:BB")).rejects.toThrow(NotFoundError);

  });
});
