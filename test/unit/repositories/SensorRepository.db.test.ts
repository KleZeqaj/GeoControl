import { SensorRepository } from "@repositories/SensorRepository";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import {
  initializeTestDataSource,
  closeTestDataSource,
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

  async function createGateway(mac = "GW:01:02") {
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

    const sensor = await repo.createSensor("SENS-01", gateway, "Temp Sensor", "Measures temperature", "temp", "°C");

    expect(sensor.macAddress).toBe("SENS-01");
    expect(sensor.name).toBe("Temp Sensor");
    expect(sensor.gatewayMac).toBe(gateway.macAddress);
  });

  it("getSensorByMacAddress should return sensor", async () => {
    const gateway = await createGateway();
    await repo.createSensor("SENS-02", gateway);
    
    const result = await repo.getSensorByMacAddress("SENS-02");
    expect(result.macAddress).toBe("SENS-02");
  });

  it("getAllSensors should return all sensors for a gateway", async () => {
    const gateway = await createGateway();
    await repo.createSensor("SENS-03", gateway);
    await repo.createSensor("SENS-04", gateway);

    const sensors = await repo.getAllSensors(gateway.macAddress);
    expect(sensors.length).toBe(2);
  });

  it("deleteSensor should remove a sensor", async () => {
    const gateway = await createGateway();
    await repo.createSensor("SENS-05", gateway);

    await repo.deleteSensor("SENS-05");

    const sensors = await repo.getAllSensors(gateway.macAddress);
    expect(sensors.length).toBe(0);
  });

  it("updateSensor should update sensor data", async () => {
    const gateway = await createGateway();
    await repo.createSensor("SENS-06", gateway, "OldName", "OldDesc", "oldVar", "oldUnit");

    await repo.updateSensor(
      gateway.macAddress,
      "SENS-06",
      "SENS-NEW",
      "NewName",
      "NewDesc",
      "newVar",
      "newUnit"
    );

    const updated = await repo.getSensorByMacAddress("SENS-NEW");
    expect(updated.name).toBe("NewName");
    expect(updated.description).toBe("NewDesc");
    expect(updated.variable).toBe("newVar");
    expect(updated.unit).toBe("newUnit");
  });

  it("createSensor throws on duplicate mac", async () => {
    const gateway = await createGateway();
    await repo.createSensor("SENS-07", gateway);

    await expect(repo.createSensor("SENS-07", gateway)).rejects.toThrow("already exists");
  });

  it("createSensor throws if mac is empty", async () => {
    const gateway = await createGateway();

    await expect(repo.createSensor("", gateway)).rejects.toThrow("length >= 1");
  });

  it("deleteSensor throws if mac is empty", async () => {
    await expect(repo.deleteSensor("")).rejects.toThrow("length >= 1");
  });
});

