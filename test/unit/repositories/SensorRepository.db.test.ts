import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { SensorRepository } from "@repositories/SensorRepository";
import {
  closeTestDataSource,
  initializeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";

describe("SensorRepository - DB tests", () => {
  const repo = new SensorRepository();

  beforeAll(async () => {
    await initializeTestDataSource();
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await TestDataSource.getRepository(SensorDAO).clear();
    await TestDataSource.getRepository(GatewayDAO).clear();
    await TestDataSource.getRepository(NetworkDAO).clear();
  });

  async function createGateway(mac = "AA:AA:AA:AA:AA:AA") {
    const network = new NetworkDAO();
    network.code = "NET1";
    network.name = "Test Network";
    await TestDataSource.getRepository(NetworkDAO).save(network);

    const gateway = new GatewayDAO();
    gateway.name = "Test Gateway";
    gateway.macAddress = mac;
    gateway.network = network;
    await TestDataSource.getRepository(GatewayDAO).save(gateway);

    return gateway;
  }

  it("createSensor should insert a sensor", async () => {
    const gateway = await createGateway();

    const sensor = await repo.createSensor("BB:BB:BB:BB:BB:BB", gateway, "Temp Sensor", "Measures temperature", "temp", "°C");

    expect(sensor.macAddress).toBe("BB:BB:BB:BB:BB:BB");
    expect(sensor.name).toBe("Temp Sensor");
    expect(sensor.gatewayMac).toBe(gateway.macAddress);
  });

  it("getSensorByMacAddress should return sensor", async () => {
    const gateway = await createGateway();
    await repo.createSensor("BB:BB:BB:BB:BB:BB", gateway, "Prova sensore");
    
    const result = await repo.getSensorByMacAddress("BB:BB:BB:BB:BB:BB");
    expect(result.macAddress).toBe("BB:BB:BB:BB:BB:BB");
    expect(result.name).toBe("Prova sensore");
    expect(result.description).toBe(null);
    expect(result.unit).toBe(null);
    expect(result.variable).toBe(null);
  });

  it("getSensorByMacAddress should throw NotFoundError", async () => {
    await expect(repo.getSensorByMacAddress("BB:BB:BB:BB:BB:BB")).rejects.toThrow(NotFoundError);
  });

  it("getAllSensors should return all sensors for a gateway", async () => {
    const gateway = await createGateway();
    await repo.createSensor("BB:BB:BB:BB:BB:BB", gateway, "Prova sensore", "Descrizione1");
    await repo.createSensor("CC:CC:CC:CC:CC:CC", gateway, "SENS2", "Descrizione2", "temperature", "C");

    const sensors = await repo.getAllSensors(gateway.macAddress);
    expect(sensors.length).toBe(2);
    expect(sensors[0].macAddress).toBe("BB:BB:BB:BB:BB:BB");
    expect(sensors[0].name).toBe("Prova sensore");
    expect(sensors[0].description).toBe("Descrizione1");
    expect(sensors[0].unit).toBe(null);
    expect(sensors[0].variable).toBe(null);
    expect(sensors[1].macAddress).toBe("CC:CC:CC:CC:CC:CC");
    expect(sensors[1].name).toBe("SENS2");
    expect(sensors[1].description).toBe("Descrizione2");
    expect(sensors[1].unit).toBe("C");
    expect(sensors[1].variable).toBe("temperature");
  });

  it("deleteSensor should remove a sensor", async () => {
    const gateway = await createGateway();
    await repo.createSensor("BB:BB:BB:BB:BB:BB", gateway);

    const result = await repo.getSensorByMacAddress("BB:BB:BB:BB:BB:BB");
    expect(result.macAddress).toBe("BB:BB:BB:BB:BB:BB");

    await repo.deleteSensor("BB:BB:BB:BB:BB:BB");

    const sensors = await repo.getAllSensors(gateway.macAddress);
    expect(sensors.length).toBe(0);
  });

  it("deleteSensor should throw NotFoundError", async () => {
    await expect(repo.deleteSensor("BB:BB:BB:BB:BB:BB")).rejects.toThrow(NotFoundError);
  });

  it("updateSensor should update sensor data", async () => {
    const gateway = await createGateway();
    await repo.createSensor("BB:BB:BB:BB:BB:BB", gateway, "OldName", "OldDesc", "oldVar", "oldUnit");

    await repo.updateSensor(
      gateway.macAddress,
      "BB:BB:BB:BB:BB:BB",
      "CC:CC:CC:CC:CC:CC",
      "NewName",
      "NewDesc",
      "newVar",
      "newUnit"
    );

    const updated = await repo.getSensorByMacAddress("CC:CC:CC:CC:CC:CC");
    expect(updated.name).toBe("NewName");
    expect(updated.description).toBe("NewDesc");
    expect(updated.variable).toBe("newVar");
    expect(updated.unit).toBe("newUnit");
  });

  it("createSensor throws on duplicate mac", async () => {
    const gateway = await createGateway();
    await repo.createSensor("BB:BB:BB:BB:BB:BB", gateway);

    await expect(repo.createSensor("BB:BB:BB:BB:BB:BB", gateway)).rejects.toThrow(ConflictError);
  });

});

