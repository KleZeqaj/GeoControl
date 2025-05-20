import { MeasurementDAO } from "@dao/MeasurementDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";


beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  // Pulisce tutto in ordine inverso di dipendenza
  await TestDataSource.getRepository(MeasurementDAO).clear();
  await TestDataSource.getRepository(SensorDAO).clear();
  await TestDataSource.getRepository(GatewayDAO).clear();
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("MeasurementRepository: SQLite in-memory", () => {
  const repo = new MeasurementRepository();
  
  async function createSensor(networkCode = "NET1", gatewayMac = "AA:BB:CC", sensorMac = "11:22:33") {
    const network = new NetworkDAO();
    network.code = networkCode;
    network.name = "Test Network";
    await TestDataSource.getRepository(NetworkDAO).save(network);

    const gateway = new GatewayDAO();
    gateway.name = "Test Gateway";
    gateway.macAddress = gatewayMac;
    gateway.network = network;
    await TestDataSource.getRepository(GatewayDAO).save(gateway);

    const sensor = new SensorDAO();
    sensor.name = "Test Sensor";
    sensor.macAddress = sensorMac;
    sensor.gateway = gateway;
    await TestDataSource.getRepository(SensorDAO).save(sensor);

    return { network, gateway, sensor };
  }

  it("storeMeasurements should save and retrieve measurements", async () => {
    const { network, gateway, sensor } = await createSensor();

    const now = new Date();
    const values = new Map<Date, number>([
      [now, 42.5]
    ]);
    //eseguo la store di una misura
    const stored = await repo.storeMeasurements(network.code, gateway.macAddress, sensor.macAddress, values);
    expect(stored.length).toBe(1);
    expect(stored[0].value).toBe(42.5);
    expect(stored[0].sensorMacAddress).toBe(sensor.macAddress);

    //verifico che la store sia stata fatta correttamente
    const retrieved = await repo.getAllMeasurementsOfSensor(network.code, gateway.macAddress, sensor.macAddress);
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].value).toBe(42.5);
  });

  it("getAllMeasurementsOfSensor should filter by date range", async () => {
    const { network, gateway, sensor } = await createSensor();

    const t1 = new Date("2024-01-01T00:00:00Z");
    const t2 = new Date("2024-01-02T00:00:00Z");
    const t3 = new Date("2024-01-03T00:00:00Z");

    const values = new Map<Date, number>([
      [t1, 10],
      [t2, 20],
      [t3, 30]
    ]);

    await repo.storeMeasurements(network.code, gateway.macAddress, sensor.macAddress, values);

    //verifico che il risultato sia la misurazione con data compresa nell'intervallo
    const results = await repo.getAllMeasurementsOfSensor(
      network.code,
      gateway.macAddress,
      sensor.macAddress,
      new Date("2024-01-01T12:00:00Z"),
      new Date("2024-01-03T00:00:00Z")
    );

    expect(results.length).toBe(1);
    expect(results[0].value).toBe(20);
  });

  it("getAllMeasurementsOfNetwork should retrieve all sensors' data", async () => {
    const { network, gateway, sensor } = await createSensor("NET2", "AA:AA:AA", "33:44:55");

    const now = new Date();
    const values = new Map<Date, number>([
      [now, 50]
    ]);

    await repo.storeMeasurements(network.code, gateway.macAddress, sensor.macAddress, values);

    const results = await repo.getAllMeasurementsOfNetwork(network.code);
    expect(results.length).toBe(1);
    expect(results[0].value).toBe(50);
  });

  it("getValidMacs should return existing sensor macs", async () => {
    const { network } = await createSensor("NET3", "FF:FF:FF", "66:77:88");

    const macs = await repo.getValidMacs(network.code, ["66:77:88", "00:00:00"]);
    expect(macs).toContain("66:77:88");
    expect(macs).not.toContain("00:00:00");
  });

  it("getValidMacs should return all macs if none are filtered", async () => {
    const { network } = await createSensor("NET4", "DD:DD:DD", "99:88:77");

    const macs = await repo.getValidMacs(network.code);
    expect(macs).toContain("99:88:77");
  });
});
