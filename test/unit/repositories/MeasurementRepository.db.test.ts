import { GatewayDAO } from "@dao/GatewayDAO";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import {
  closeTestDataSource,
  initializeTestDataSource,
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
  const networkRepo = new NetworkRepository();
  const gatewayRepo = new GatewayRepository();
  const sensorRepo = new SensorRepository();

  const createNetwork = async () => {
    const net = await networkRepo.createNewNetwork("NET01", "ALP", "DESC");
    return net
  }

  const createGateway = async (network) => {
    const gate = await gatewayRepo.createGateway("NET01", "AA:AA:AA:AA:AA:AA", "GW01", network);
    return gate
  }

  const createSens = async (gateway) => {
    const sensor = await sensorRepo.createSensor("DD:DD:DD:DD:DD:DD", gateway, "TH01", "Descrizione TH01", "Temperture", "C");
    return sensor;
  }
  
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

  it("getAllMeasurementsOfSensor: not found entities", async () => {
    const net = await createNetwork();
    const gate = await createGateway(net);
    const sens = await createSens(gate);

    const t1 = new Date("2024-01-01T00:00:00Z");
    const t2 = new Date("2024-01-02T00:00:00Z");

    await expect(
      repo.getAllMeasurementsOfSensor("NET02", "AA:AA:AA:AA:AA:AA", "DD:DD:DD:DD:DD:DD", t1, t2) 
    ).rejects.toThrow(NotFoundError);

    await expect(
      repo.getAllMeasurementsOfSensor("NET01", "CC:CC:CC:CC:CC:CC", "DD:DD:DD:DD:DD:DD", t1, t2)
    ).rejects.toThrow(NotFoundError);

    await expect(
      repo.getAllMeasurementsOfSensor("NET01", "AA:AA:AA:AA:AA:AA", "DD:DD:DD:DD:DD:DE", t1, t2) 
    ).rejects.toThrow(NotFoundError);    

  })

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
      new Date("2024-01-02T12:00:00Z")
    );

    expect(results.length).toBe(1);
    expect(results[0].value).toBe(20);
  });

  it("getAllMeasurementsOfSensor filters by startDate only", async () => {
    const { network, gateway, sensor } = await createSensor("NET05", "AA:BB:CC:DD:EE:FF", "11:22:33:44:55:66");

    const values = new Map<Date, number>([
      [new Date("2024-01-01T00:00:00Z"), 10],
      [new Date("2024-01-02T00:00:00Z"), 20],
      [new Date("2024-01-03T00:00:00Z"), 30]
    ]);

    await repo.storeMeasurements(network.code, gateway.macAddress, sensor.macAddress, values);

    const result = await repo.getAllMeasurementsOfSensor(
      network.code,
      gateway.macAddress,
      sensor.macAddress,
      new Date("2024-01-01T12:00:00Z")
    );

    expect(result.length).toBe(2);
    expect(result[0].value).toBe(20);
    expect(result[1].value).toBe(30);
  });

  it("getAllMeasurementsOfSensor filters by endDate only", async () => {
    const { network, gateway, sensor } = await createSensor("NET06", "CC:CC:CC:CC:CC:CC", "FF:FF:FF:FF:FF:FF");

    const values = new Map<Date, number>([
      [new Date("2024-01-01T00:00:00Z"), 10],
      [new Date("2024-01-02T00:00:00Z"), 20]
    ]);

    await repo.storeMeasurements(network.code, gateway.macAddress, sensor.macAddress, values);

    const result = await repo.getAllMeasurementsOfSensor(
      network.code,
      gateway.macAddress,
      sensor.macAddress,
      undefined,
      new Date("2024-01-01T23:59:59Z")
    );

    expect(result.length).toBe(1);
    expect(result[0].value).toBe(10);
  });

  it("getAllMeasurementsOfNetwork: not found network", async () => {
    const net = await createNetwork();
    const gate = await createGateway(net);
    const sens = await createSens(gate);

    const t1 = new Date("2024-01-01T00:00:00Z");
    const t2 = new Date("2024-01-02T00:00:00Z");

    await expect(
      repo.getAllMeasurementsOfNetwork("NET02", ["DD:DD:DD:DD:DD:DD"], t1, t2) 
    ).rejects.toThrow(NotFoundError);

  })

  it("getAllMeasurementsOfNetwork should retrieve all sensors' data", async () => {
    const { network, gateway, sensor } = await createSensor("NET02", "AA:AA:AA:AA:AA:AA", "33:44:55:66:77:88");
    const gate = await createGateway(network);
    const sens = await createSens(gate);

    const now = new Date();
    const values = new Map<Date, number>([
      [now, 50]
    ]);

    
    const values2 = new Map<Date, number>([
      [now, 60]
    ]);
    
    await repo.storeMeasurements(network.code, gateway.macAddress, sensor.macAddress, values);
    await repo.storeMeasurements(network.code, gate.macAddress, sens.macAddress, values2);

    const results = await repo.getAllMeasurementsOfNetwork(network.code);
    expect(results.length).toBe(2);
    expect(results[0].value).toBe(50);
    expect(results[1].value).toBe(60);
  });

it("getAllMeasurementsOfNetwork filters by startDate only", async () => {
    const { network, gateway, sensor } = await createSensor("NET07", "AA:AA:AA:AA:AA:AA", "11:11:11:11:11:11");

    const values = new Map<Date, number>([
      [new Date("2024-01-01T00:00:00Z"), 10],
      [new Date("2024-01-02T00:00:00Z"), 20]
    ]);

    await repo.storeMeasurements(network.code, gateway.macAddress, sensor.macAddress, values);

    const results = await repo.getAllMeasurementsOfNetwork(
      network.code,
      undefined,
      new Date("2024-01-02T00:00:00Z")
    );

    expect(results.length).toBe(1);
    expect(results[0].value).toBe(20);
  });

  it("getAllMeasurementsOfNetwork filters by endDate only", async () => {
    const { network, gateway, sensor } = await createSensor("NET08", "AA:AA:AA:AA:AA:AA", "11:11:11:11:11:11");

    const values = new Map<Date, number>([
      [new Date("2024-01-01T00:00:00Z"), 10],
      [new Date("2024-01-03T00:00:00Z"), 30]
    ]);

    await repo.storeMeasurements(network.code, gateway.macAddress, sensor.macAddress, values);

    const results = await repo.getAllMeasurementsOfNetwork(
      network.code,
      undefined,
      undefined,
      new Date("2024-01-03T23:59:59Z")
    );

    expect(results.length).toBe(2);
    expect(results[0].value).toBe(10);
    expect(results[1].value).toBe(30);
  });

    it("getAllMeasurementsOfNetwork filters by startDate and endDate", async () => {
    const { network, gateway, sensor } = await createSensor("NET09", "BB:CC:DD:EE:FF:FF", "22:22:22:22:22:22");

    const values = new Map<Date, number>([
      [new Date("2024-01-01T00:00:00Z"), 5],
      [new Date("2024-01-02T00:00:00Z"), 15],
      [new Date("2024-01-03T00:00:00Z"), 25]
    ]);

    await repo.storeMeasurements(network.code, gateway.macAddress, sensor.macAddress, values);
    

    const results = await repo.getAllMeasurementsOfNetwork(
      network.code,
      undefined,
      new Date("2024-01-01T12:00:00Z"),
      new Date("2024-01-02T23:59:59Z")
    );

    expect(results.length).toBe(1);
    expect(results[0].value).toBe(15);
  });


  
  it("storeMeasurements : not found entities", async () => {
    const net = await createNetwork();
    const gate = await createGateway(net);
    const sens = await createSens(gate);

    const t1 = new Date("2024-01-01T00:00:00Z");
    const t2 = new Date("2024-01-02T00:00:00Z");

    const values = new Map<Date, number>([
      [t1, 5],
      [t2, 15]
    ]);

    await expect(
     repo.storeMeasurements("NET02", gate.macAddress, sens.macAddress, values)
    ).rejects.toThrow(NotFoundError);

    await expect(
      repo.storeMeasurements(net.code, "BB:BB:BB:BB:BB:BB", sens.macAddress, values)
    ).rejects.toThrow(NotFoundError);

    await expect(
      repo.storeMeasurements(net.code, gate.macAddress, "11:11:11:11:11:11", values)
    ).rejects.toThrow(NotFoundError);

  })

  it("storeMeasurements", async () => {
    const net = await createNetwork();
    const gate = await createGateway(net);
    const sens = await createSens(gate);

    const t1 = new Date("2024-01-01T12:00:00Z");
    const t2 = new Date("2024-01-01T12:30:00Z");
    const t3 = new Date("2024-01-02T12:30:00Z");
    const t4 = new Date("2024-01-02T12:30:00Z");
    

    const values = new Map<Date, number>([
      [t1, 5],
      [t2, 15],
      [t3, 20],
      [t4, 25]
    ]);
    
    await repo.storeMeasurements(net.code, gate.macAddress, sens.macAddress, values);
    const result = await repo.getAllMeasurementsOfSensor(net.code, gate.macAddress,sens.macAddress, new Date("2024-01-01T00:00:00Z"), new Date("2024-01-03T00:00:00Z"));
    expect(result.length).toBe(4);
    expect(result.map((a) => a.value)).toEqual([5, 15, 20, 25]);
  })

  it("getValidMacs should return existing sensor macs", async () => {
    const net = await createNetwork();
    const gate = await createGateway(net);
    const sens1 = await createSens(gate); 

    const macs = await repo.getValidMacs(net.code, [sens1.macAddress, "00:00:00:00:00:00"]);
    expect(macs).toContain(sens1.macAddress);
    expect(macs).not.toContain("00:00:00:00:00:00");
  });

  it("getValidMacs should return all macs if none are filtered", async () => {
    const { network } = await createSensor("NET04", "DD:DD:DD:DD:DD:DD", "99:88:77:66:55:44");

    const macs = await repo.getValidMacs(network.code);
    expect(macs).toContain("99:88:77:66:55:44");
  });

});
