import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import {
  closeTestDataSource,
  initializeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { getOutliers } from "@services/measurementService";
import { Measurements as MeasurementsDTO } from "@models/dto/Measurements";
import { parseDate } from "@services/measurementService";
import { BadRequestError } from "@models/errors/BadRequestError";
import { Stats } from "@models/dto/Stats";
import type { Measurement } from '@models/dto/Measurement';

describe("Measurement Service integration", () => {
  const networkRepo = new NetworkRepository();
  const gatewayRepo = new GatewayRepository();
  const sensorRepo = new SensorRepository();
  const measurementRepo = new MeasurementRepository();

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

  /*it("store and retrieve measurements", async () => {
    const network = await networkRepo.createNewNetwork("NET01", "Network1", "Desc");
    const gateway = await gatewayRepo.createGateway("AA:AA:AA:AA:AA:AA", "GW1", "Desc", network);
    const sensor = await sensorRepo.createSensor("00:11:22:33:44:55", gateway, "SENS01", "Temperature", "C", "temp");

    const date = new Date();
    const values = new Map<Date, number>([[date, 22.5], [new Date(date.getTime() + 1000), 23.1]]);
    await measurementRepo.storeMeasurements(network.code, gateway.macAddress, sensor.macAddress, values);

    const retrieved = await measurementRepo.getAllMeasurementsOfSensor(network.code, gateway.macAddress, sensor.macAddress);
    expect(retrieved.length).toBe(2);
  });

  it("get valid MACs with filtering", async () => {
    const network = await networkRepo.createNewNetwork("NET01", "Network1", "Desc");
    const gateway = await gatewayRepo.createGateway("AA:AA:AA:AA:AA:AA", "GW1", "Desc", network);
    const sensor1 = await sensorRepo.createSensor("00:11:22:33:44:55",gateway, "SENS01", "Temperature", "C", "temp");
    const sensor2 = await sensorRepo.createSensor("00:11:22:33:44:66", gateway, "SENS02", "Humidity", "%", "hum");

    const macs = await measurementRepo.getValidMacs(network.code, [sensor1.macAddress]);
    expect(macs).toContain(sensor1.macAddress);
    expect(macs).not.toContain("nonexistent");
  });

  it("throws error on nonexistent network", async () => {
    await expect(
      measurementRepo.getAllMeasurementsOfSensor("NONET", "ANY", "ANY")
    ).rejects.toThrow();
  });

  it("handles empty measurements gracefully", async () => {
    const network = await networkRepo.createNewNetwork("NET01", "Network1", "Desc");
    const gateway = await gatewayRepo.createGateway("AA:AA:AA:AA:AA:AA", "GW1", "Desc", network);
    const sensor = await sensorRepo.createSensor("00:11:22:33:44:55", gateway, "SENS01", "Temperature", "C", "temp");

    const result = await measurementRepo.getAllMeasurementsOfSensor(network.code, gateway.macAddress, sensor.macAddress);
    expect(result.length).toBe(0);
  });*/

    it("getOutliers: risultato corretto", async () => {

    const stats: Stats = {
      mean: 4.56,
      variance: 7.65,
      upperThreshold: 10,
      lowerThreshold: 2
    }

    const measurements: Measurement[] = [{
      value: 7.0,
      createdAt: new Date("2025-02-18T16:00:00Z"),
      isOutlier: true
    }, {
      value: 4.3,
      createdAt: new Date("2025-02-18T16:00:00Z"),
      isOutlier: false
    }, {
      value: 8.9,
      createdAt: new Date("2025-02-18T16:00:00Z"),
      isOutlier: false
    }]

    const measurementsDTO: MeasurementsDTO = {
      sensorMacAddress: "AA:AA:AA:AA:AA:AA",
      stats: stats,
      measurements: measurements
    };

    const result = await getOutliers(measurementsDTO);
    expect(result.measurements.length).toBe(1);
    expect(result.measurements[0].value).toBe(7.0);
  });

  it("getOutliers: assenza di outliers", async () => {

    const stats: Stats = {
      mean: 4.56,
      variance: 7.65,
      upperThreshold: 10,
      lowerThreshold: 2
    }

    const measurements: Measurement[] = [{
      value: 7.0,
      createdAt: new Date("2025-02-18T16:00:00Z"),
      isOutlier: false
    }, {
      value: 4.3,
      createdAt: new Date("2025-02-18T16:00:00Z"),
      isOutlier: false
    }, {
      value: 8.9,
      createdAt: new Date("2025-02-18T16:00:00Z"),
      isOutlier: false
    }]

    const measurementsDTO: MeasurementsDTO = {
      sensorMacAddress: "AA:AA:AA:AA:AA:AA",
      stats: stats,
      measurements: measurements
    };

    const result = await getOutliers(measurementsDTO);
    expect(result.measurements.length).toBe(0);
  });

  it("getOutliers: null measurements", async () => {

    const stats: Stats = {
      mean: 4.56,
      variance: 7.65,
      upperThreshold: 10,
      lowerThreshold: 2
    }

    const measurementsDTO: MeasurementsDTO = {
      sensorMacAddress: "AA:AA:AA:AA:AA:AA",
      stats: stats,
      measurements: null
    };

    const result = await getOutliers(measurementsDTO);
    expect(result.measurements).toBeNull();
  });

  it("throw BadRequestError on invalid ISO string", () => {
    const bad = "not-a-valid-date";

    expect(() => parseDate(bad)).toThrow(BadRequestError);
    expect(() => parseDate(bad)).toThrow(
      "Invalid date format. Expected ISO 8601 format (e.g., 2023-10-01T00:00:00Z)"
    );
  });

  it("returns a Date for a valid ISO string", () => {
    const iso = "2023-10-01T12:34:56.000Z";
    const dt = parseDate(iso);
    expect(dt.toISOString()).toBe(iso);
  });

});
