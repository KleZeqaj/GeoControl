import {
  storeMeasurements,
  getAllMeasurementsOfSensor,
  getAllStatsOfSensor,
  getAllOutliersOfSensor,
  getAllMeasurementsOfNetwork,
  getAllStatsOfNetwork,
  getAllOutliersOfNetwork
} from "@controllers/measurementController";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { SensorRepository } from "@repositories/SensorRepository";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(MeasurementDAO).clear();
  await TestDataSource.getRepository(SensorDAO).clear();
  await TestDataSource.getRepository(GatewayDAO).clear();
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("MeasurementController: SQLite in-memory", () => {
  const NetworkRepo = new NetworkRepository();
  const GatewayRepo = new GatewayRepository();
  const SensorRepo = new SensorRepository();

  const networkCode = "NET01";
  const gatewayMac = "AA:AA:AA:AA:AA:AA";
  const sensorMac = "BB:BB:BB:BB:BB:BB";

  async function setupEntities() {
    const netDAO = new NetworkDAO();
    netDAO.code = networkCode;
    netDAO.description = "Descrizione rete";
    netDAO.name = "Rete";
    const network = await NetworkRepo.createNewNetwork(netDAO.code, netDAO.name, netDAO.description);

    const gatewayDAO = new GatewayDAO();
    gatewayDAO.network = netDAO;
    gatewayDAO.macAddress = gatewayMac;
    gatewayDAO.name = "GW01";
    gatewayDAO.description = "Descrizione GW";
    const gateway = await GatewayRepo.createGateway(gatewayDAO.macAddress, gatewayDAO.name, gatewayDAO.description, gatewayDAO.network);

    const sensorDAO = new SensorDAO();
    sensorDAO.gateway = gatewayDAO;
    sensorDAO.macAddress = sensorMac;
    sensorDAO.name = "SENS01";
    sensorDAO.description = "Descrizione SENS01";
    sensorDAO.unit = "C";
    sensorDAO.variable = "temperature";
    const sensor = await SensorRepo.createSensor(sensorDAO.macAddress, sensorDAO.gateway, sensorDAO.name, sensorDAO.description, sensorDAO.variable, sensorDAO.unit);

    return { network, gateway, sensor };
  }

  it("store and retrieve measurements for sensor", async () => {
    await setupEntities();

    const measurements = [
      { createdAt: new Date(), value: 22.5 },
      { createdAt: new Date(), value: 23.1 },
      { createdAt: new Date(), value: 22.8 }
    ];

    await storeMeasurements(networkCode, gatewayMac, sensorMac, measurements);

    const result = await getAllMeasurementsOfSensor(networkCode, gatewayMac, sensorMac);
    expect(result.measurements.length).toBe(3);
  });

  it("get stats of sensor", async () => {
    await setupEntities();
    const measurements = [
      { createdAt: new Date(), value: 10 },
      { createdAt: new Date(), value: 20 },
      { createdAt: new Date(), value: 30 }
    ];
    await storeMeasurements(networkCode, gatewayMac, sensorMac, measurements);
    const stats = await getAllStatsOfSensor(networkCode, gatewayMac, sensorMac);
    expect(stats).toHaveProperty("mean");
  });

  it("get outliers of sensor", async () => {
    await setupEntities();
    const measurements = [
      { createdAt: new Date(), value: 5 },
      { createdAt: new Date(), value: 100 },
      { createdAt: new Date(), value: 6 }
    ];
    await storeMeasurements(networkCode, gatewayMac, sensorMac, measurements);
    const result = await getAllOutliersOfSensor(networkCode, gatewayMac, sensorMac);
    expect(result.measurements.length).toBeGreaterThanOrEqual(0);
  });


  it("get all measurements/stats/outliers of network", async () => {
    await setupEntities();
    const measurements = [
      { createdAt: new Date(), value: 20 },
      { createdAt: new Date(), value: 21 },
      { createdAt: new Date(), value: 22 }
    ];
    await storeMeasurements(networkCode, gatewayMac, sensorMac, measurements);

    const netMeasurements = await getAllMeasurementsOfNetwork(networkCode);
    expect(netMeasurements[0].measurements.length).toBe(3);

    const netStats = await getAllStatsOfNetwork(networkCode);
    expect(netStats[0].stats).toHaveProperty("mean");

    const netOutliers = await getAllOutliersOfNetwork(networkCode);
    expect(netOutliers[0].sensorMacAddress).toBe(sensorMac);
  });


  //aggiunta controllo outliers per network
  it("retrieves outliers of network correctly", async () => {
  const netDAO = new NetworkDAO();
  netDAO.code = "NET01";
  netDAO.name = "Rete1";
  netDAO.description = "Descrizione rete1";
  const net = await NetworkRepo.createNewNetwork(netDAO.code, netDAO.name, netDAO.description);

  const gatewayDAO = new GatewayDAO();
  gatewayDAO.network = netDAO;
  gatewayDAO.macAddress = "AA:AA:AA:AA:AA:AA";
  gatewayDAO.name = "GW01";
  gatewayDAO.description = "Descrizione GW01";
  const gat = await GatewayRepo.createGateway(gatewayDAO.macAddress, gatewayDAO.name, gatewayDAO.description, gatewayDAO.network);

  const sensorDAO = new SensorDAO();
  sensorDAO.gateway = gatewayDAO;
  sensorDAO.macAddress = "BB:BB:BB:BB:BB:BB";
  sensorDAO.name = "SENS01";
  sensorDAO.description = "Descrizione SENS01";
  sensorDAO.unit = "C";
  sensorDAO.variable = "temperature";
  await SensorRepo.createSensor(sensorDAO.macAddress, sensorDAO.gateway, sensorDAO.name, sensorDAO.description, sensorDAO.variable, sensorDAO.unit);


  const normalValues = [20, 21, 19, 22, 20];
  const extremeValue = 100; //outlier

  const measurements = [
    ...normalValues.map(v => ({ createdAt: new Date(), value: v })),
    { createdAt: new Date(), value: extremeValue }
  ];

  await storeMeasurements(netDAO.code, gatewayDAO.macAddress, sensorDAO.macAddress, measurements);

  const netOutliers = await getAllOutliersOfNetwork(netDAO.code);
  expect(netOutliers).toHaveLength(1);
  const outlierValues = netOutliers[0].measurements.map(m => m.value);
  
  expect(outlierValues).toContain(extremeValue);
  normalValues.forEach(v => expect(outlierValues).not.toContain(v));
});


  it("should throw NotFoundError if network, gateway or sensor not exist", async () => {
    await expect(
      getAllMeasurementsOfSensor("INVALID", gatewayMac, sensorMac)
    ).rejects.toThrow(NotFoundError);

    await NetworkRepo.createNewNetwork(networkCode, "Net", "Desc");
    await expect(
      getAllMeasurementsOfSensor(networkCode, gatewayMac, sensorMac)
    ).rejects.toThrow(NotFoundError);

    const net = await NetworkRepo.getNetworkByCode(networkCode);
    await GatewayRepo.createGateway(gatewayMac, "GW", "Desc", net);
    await expect(
      getAllMeasurementsOfSensor(networkCode, gatewayMac, sensorMac)
    ).rejects.toThrow(NotFoundError);
  });

  it("getAllMeasurementsOfSensor with startDate and endDate", async () => {
    const { sensor } = await setupEntities();
    const now = new Date();
    const past_1 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 days ago
    const past_2 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const today = new Date(now);
    const future = new Date(now.getTime() + 1000); 

    await storeMeasurements(networkCode, gatewayMac, sensorMac, [
        { createdAt: past_2, value: 10 },
        { createdAt: today, value: 20 }
    ]);

    const result = await getAllMeasurementsOfSensor(
        networkCode,
        gatewayMac,
        sensorMac,
        past_1.toISOString(),
        future.toISOString()
    );
    
    expect(result.measurements).toHaveLength(1);
    expect(result.measurements[0].value).toBe(20);
});

it("getAllStatsOfSensor with startDate and endDate", async () => {
    await setupEntities();
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    await storeMeasurements(networkCode, gatewayMac, sensorMac, [
        { createdAt: yesterday, value: 15 },
        { createdAt: now, value: 30 }
    ]);

    const stats = await getAllStatsOfSensor(
        networkCode,
        gatewayMac,
        sensorMac,
        yesterday.toISOString(),
        now.toISOString()
    );

    expect(stats).toHaveProperty("mean");
});

it("getAllOutliersOfSensor with startDate and endDate", async () => {
    await setupEntities();
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const past = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await storeMeasurements(networkCode, gatewayMac, sensorMac, [
        { createdAt: yesterday, value: 11 },
        { createdAt: yesterday, value: 11 },
        { createdAt: yesterday, value: 11 },
        { createdAt: now, value: 11 },
        { createdAt: now, value: 11 },
        { createdAt: now, value: 50 } // outlier
    ]);

    const outliers = await getAllOutliersOfSensor(
        networkCode,
        gatewayMac,
        sensorMac,
        past.toISOString(),
        tomorrow.toISOString()
    );

    const outlierValues = outliers.measurements.map(m => m.value);
    expect(outlierValues).toContain(50);

});

it("getAllMeasurementsOfNetwork with specific sensorMacs", async () => {
    const { gateway } = await setupEntities();
    const otherSensorMac = "CC:CC:CC:CC:CC:CC";
    await SensorRepo.createSensor(
        otherSensorMac,
        gateway,
        "Sensor2",
        "Desc2",
        "humidity",
        "%"
    );

    const measurements = [
        { createdAt: new Date(), value: 50 }
    ];

    await storeMeasurements(networkCode, gatewayMac, sensorMac, measurements);
    await storeMeasurements(networkCode, gatewayMac, otherSensorMac, measurements);

    const result = await getAllMeasurementsOfNetwork(networkCode, [sensorMac]);
    expect(result).toHaveLength(1);
    expect(result[0].sensorMacAddress).toBe(sensorMac);
});

it("getAllStatsOfNetwork with specific sensorMacs", async () => {
    const { gateway } = await setupEntities();
    const otherSensorMac = "CC:CC:CC:CC:CC:CC";
    await SensorRepo.createSensor(
        otherSensorMac,
        gateway,
        "Sensor2",
        "Desc2",
        "humidity",
        "%"
    );

    const measurements = [
        { createdAt: new Date(), value: 50 }
    ];

    await storeMeasurements(networkCode, gatewayMac, sensorMac, measurements);
    await storeMeasurements(networkCode, gatewayMac, otherSensorMac, measurements);

    const stats = await getAllStatsOfNetwork(networkCode, [sensorMac]);
    expect(stats).toHaveLength(1);
    expect(stats[0].sensorMacAddress).toBe(sensorMac);
});

it("getAllOutliersOfNetwork with specific sensorMacs", async () => {
    const { gateway } = await setupEntities();
    const otherSensorMac = "CC:CC:CC:CC:CC:CC";
    await SensorRepo.createSensor(
        otherSensorMac,
        gateway,
        "Sensor2",
        "Desc2",
        "humidity",
        "%"
    );

    const measurements = [
        { createdAt: new Date(), value: 20 },
        { createdAt: new Date(), value: 100 } // outlier
    ];

    //await storeMeasurements(networkCode, gatewayMac, sensorMac, measurements);
    await storeMeasurements(networkCode, gatewayMac, otherSensorMac, measurements);

    const outliers = await getAllOutliersOfNetwork(networkCode, [otherSensorMac]);
    expect(outliers.length).toBeGreaterThan(0);
    expect(outliers).toHaveLength(1);
    const outlierValues = outliers[0].measurements.map(m => m.value) || [];
    expect(outlierValues).toContain(100);
});

it("getAllMeasurementsOfNetwork with empty sensorMacs array", async () => {
    await setupEntities();

    const measurements = [
        { createdAt: new Date(), value: 25 }
    ];

    await storeMeasurements(networkCode, gatewayMac, sensorMac, measurements);

    const result = await getAllMeasurementsOfNetwork(networkCode, []);
    expect(result).toHaveLength(1);
});

it("getAllMeasurementsOfNetwork returns empty array when no data", async () => {
    await setupEntities();

    const result = await getAllMeasurementsOfNetwork(networkCode);
   
    const totalMeasurements = result.flatMap(group => group.measurements || []);
    expect(totalMeasurements).toHaveLength(0);
});


it("getAllMeasurementsOfNetwork with only startDate", async () => {
    await setupEntities();
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    await storeMeasurements(networkCode, gatewayMac, sensorMac, [
        { createdAt: yesterday, value: 10 },
        { createdAt: now, value: 20 }
    ]);

    const result = await getAllMeasurementsOfNetwork(networkCode, undefined, yesterday.toISOString());
    expect(result[0].measurements.length).toBeGreaterThan(0);
});

it("getAllMeasurementsOfNetwork with only endDate", async () => {
    await setupEntities();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await storeMeasurements(networkCode, gatewayMac, sensorMac, [
        { createdAt: now, value: 20 },
    ]);

    const result = await getAllMeasurementsOfNetwork(networkCode, undefined, undefined, tomorrow.toISOString());
    expect(result[0].measurements.length).toBeGreaterThan(0);
});

it("getValidMacs returns empty when no matching sensors", async () => {
    await setupEntities();

    const result = await getAllMeasurementsOfNetwork(networkCode, ["NON_EXISTENT_MAC"]);
    expect(result).toEqual([]); // no valid macs, no measurements
});

it("getAllMeasurementsOfNetwork throws NotFoundError if network does not exist", async () => {
    await expect(
        getAllMeasurementsOfNetwork("NON_EXISTENT_NETWORK")
    ).rejects.toThrow(NotFoundError);
});

it("getAllStatsOfNetwork throws NotFoundError if network does not exist", async () => {
    await expect(
        getAllStatsOfNetwork("NON_EXISTENT_NETWORK")
    ).rejects.toThrow(NotFoundError);
});

it("getAllOutliersOfNetwork throws NotFoundError if network does not exist", async () => {
    await expect(
        getAllOutliersOfNetwork("NON_EXISTENT_NETWORK")
    ).rejects.toThrow(NotFoundError);
});

it("getAllMeasurementsOfNetwork with sensorMacs explicitly empty array", async () => {
    await setupEntities();

    const measurements = [
        { createdAt: new Date(), value: 15 }
    ];
    await storeMeasurements(networkCode, gatewayMac, sensorMac, measurements);

    const result = await getAllMeasurementsOfNetwork(networkCode, []);
    expect(result[0].measurements.length).toBeGreaterThan(0);
});


it("getAllStatsOfNetwork returns empty if no groupedMeasurements", async () => {
    await setupEntities();
    const result = await getAllStatsOfNetwork(networkCode, ["NON_EXISTENT_MAC"]);
    expect(result).toEqual([]);
});

it("getAllOutliersOfNetwork returns empty if no groupedMeasurements", async () => {
    await setupEntities();
    const result = await getAllOutliersOfNetwork(networkCode, ["NON_EXISTENT_MAC"]);
    expect(result).toEqual([]);
});

it("getAllStatsOfNetwork with only startDate", async () => {
    await setupEntities();
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    await storeMeasurements(networkCode, gatewayMac, sensorMac, [
        { createdAt: yesterday, value: 10 },
        { createdAt: now, value: 20 }
    ]);

    const result = await getAllStatsOfNetwork(networkCode, undefined, yesterday.toISOString());
    expect(result).toHaveLength(1);
    expect(result[0].stats).toHaveProperty("mean");
});

it("getAllStatsOfNetwork with only endDate", async () => {
    await setupEntities();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await storeMeasurements(networkCode, gatewayMac, sensorMac, [
        { createdAt: now, value: 30 }
    ]);

    const result = await getAllStatsOfNetwork(networkCode, undefined, undefined, tomorrow.toISOString());
    expect(result).toHaveLength(1);
    expect(result[0].stats).toHaveProperty("mean");
});

it("getAllOutliersOfNetwork with only startDate", async () => {
    await setupEntities();
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    await storeMeasurements(networkCode, gatewayMac, sensorMac, [
        { createdAt: yesterday, value: 10 },
        { createdAt: now, value: 100 } // outlier
    ]);

    const result = await getAllOutliersOfNetwork(networkCode, undefined, yesterday.toISOString());
    const outlierValues = result[0].measurements.map(m => m.value);
    expect(outlierValues).toContain(100);
});

it("getAllOutliersOfNetwork with only endDate", async () => {
    await setupEntities();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await storeMeasurements(networkCode, gatewayMac, sensorMac, [
        { createdAt: now, value: 100 } // outlier
    ]);

    const result = await getAllOutliersOfNetwork(networkCode, undefined, undefined, tomorrow.toISOString());
    const outlierValues = result[0].measurements.map(m => m.value);
    expect(outlierValues).toContain(100);
});


});

