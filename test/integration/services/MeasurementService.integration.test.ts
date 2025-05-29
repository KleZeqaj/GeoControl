import { GatewayDAO } from "@models/dao/GatewayDAO";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
import type { Measurement } from '@models/dto/Measurement';
import { Measurement as MeasurementDTO } from "@models/dto/Measurement";
import { Measurements as MeasurementsDTO } from "@models/dto/Measurements";
import { Stats } from "@models/dto/Stats";
import { BadRequestError } from "@models/errors/BadRequestError";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { getOutliers, groupAndComputeMeasurements, parseDate } from "@services/measurementService";
import {
  closeTestDataSource,
  initializeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";

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

  it("getOutliers: if measurements undefined/null set measurements on null", async () => {
    const empty: MeasurementsDTO = {
      sensorMacAddress: "ZZ:ZZ:ZZ:ZZ:ZZ:ZZ",
      stats: null,
      measurements: undefined as any
    };

    const result = await getOutliers(empty);
    expect(result.measurements).toBeNull();
  });

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

    it("getOutliers:filters only the measurements marked as outliers when measurements array is non-empty", async () => {
      const good: MeasurementDTO = {
      createdAt: new Date(),
      value: 10,
      isOutlier: false
    };
    const bad: MeasurementDTO = {
      createdAt: new Date(),
      value: 99,
      isOutlier: true
    };

    const dto: MeasurementsDTO = {
      sensorMacAddress: "ZZ:ZZ:ZZ:ZZ:ZZ:ZZ",
      stats: null,
      measurements: [good, bad]  
    };

    const result = await getOutliers(dto);
    expect(result.measurements).toEqual([bad]);
  });

it("groupAndComputeMeasurements: returns a MeasurementsDTO with null stats and an empty measurements array for sensors that exist but have no data ", async () => {

  const net = await networkRepo.createNewNetwork("NET02", "Net2", "Desc2");
  const gat = await gatewayRepo.createGateway("CC:CC:CC:CC:CC:CC", "GW2", "Desc", net);
  const sen = await sensorRepo.createSensor("DD:DD:DD:DD:DD:DD", gat, "S2", "Desc", "temp", "C");

  const result = await groupAndComputeMeasurements(
    [],                        
    [sen.macAddress],          
    [sen.macAddress]            
  );

  expect(result).toHaveLength(1);
  const one = result[0];
  expect(one.sensorMacAddress).toBe(sen.macAddress);
  expect(one.stats == null).toBe(true);
  expect(one.measurements).toBeUndefined();

});


});
