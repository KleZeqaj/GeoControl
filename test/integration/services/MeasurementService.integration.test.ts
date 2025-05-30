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
import { computeStats, getOutliers, groupAndComputeMeasurements, parseDate } from "@services/measurementService";
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

  it("getOutliers: risultato corretto", async () => {

    const stats: Stats = {
      mean: 4.56,
      variance: 7.65,
      upperThreshold: 10,
      lowerThreshold: 2
    }

    const measurements: Measurement[] = [{
      value: 12.0,
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
    expect(result.measurements[0].value).toBe(12.0);
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

  it("computeStats: all ok", async () => {
    let dateStart = new Date("2025-05-01T12:34:56.000Z");
    let dateEnd = new Date();
    const measurement: MeasurementDTO[] = [{
      value: 5.5,
      createdAt: dateStart
    }, {
      value: 4.5,
      createdAt: dateStart
    }, {
      value: 5,
      createdAt: dateEnd
    },]
    const measurementDTO = await computeStats(measurement, "AA:AA:AA:AA:AA:AA", new Date("2025-05-01T12:34:56.000Z"), new Date("2025-05-31T12:34:56.000Z"));
    expect(measurementDTO.stats).toBeDefined();
    expect(measurementDTO.stats.mean).toBe(5);
    expect(measurementDTO.stats.variance).toBe(0.17);
    expect(measurementDTO.stats.lowerThreshold).toBe(Number((5 - 2*0.40824829).toFixed(2)));
    expect(measurementDTO.stats.upperThreshold).toBe(Number((5 + 2*0.40824829).toFixed(2)));
    expect(measurementDTO.stats.startDate).toStrictEqual(dateStart);
    expect(measurementDTO.stats.endDate).toStrictEqual(new Date("2025-05-31T12:34:56.000Z"));
    expect(measurementDTO.measurements.length).toBe(3);
    expect(measurementDTO.measurements[0].isOutlier).toBe(false);
    expect(measurementDTO.measurements[1].isOutlier).toBe(false);
    expect(measurementDTO.measurements[2].isOutlier).toBe(false);
});

it("computeStats: dates not passed", async () => {
    let dateStart = new Date("2025-05-01T12:34:56.000Z");
    let dateEnd = new Date();
    const measurement: MeasurementDTO[] = [{
      value: 5.5,
      createdAt: dateStart
    }, {
      value: 4.5,
      createdAt: dateEnd
    }]
    const measurementDTO = await computeStats(measurement, "AA:AA:AA:AA:AA:AA");
    expect(measurementDTO.stats).toBeDefined();
    expect(measurementDTO.stats.mean).toBe(5);
    expect(measurementDTO.stats.variance).toBe(0.25);
    expect(measurementDTO.stats.lowerThreshold).toBe(Number((5 - 2*0.5).toFixed(2)));
    expect(measurementDTO.stats.upperThreshold).toBe(Number((5 + 2*0.5).toFixed(2)));
    expect(measurementDTO.stats.startDate).toStrictEqual(dateStart);
    expect(measurementDTO.stats.endDate).toStrictEqual(dateEnd);
    expect(measurementDTO.measurements.length).toBe(2);
    expect(measurementDTO.measurements[0].isOutlier).toBe(false);
    expect(measurementDTO.measurements[1].isOutlier).toBe(false);
});


function setupDataForGCM(): MeasurementDAO[] {
  
  const dataAttuale = new Date();
  const dataOraPrecedente = new Date(dataAttuale.getTime() - 60 * 60 * 1000);
  const dataDueOrePrec = new Date(dataAttuale.getTime() - 2 * 60 * 60 * 1000);

  const sensor1 = new SensorDAO();
  sensor1.macAddress = "11:11:11:11:11:11";
  const sensor3 = new SensorDAO();
  sensor3.macAddress = "33:33:33:33:33:33";

  const measurementDAOArray: MeasurementDAO[] = [
    {
      id: 1,
      createdAt: dataDueOrePrec,
      value: 20.5,
      sensorMacAddress: "11:11:11:11:11:11",
      sensor: sensor1
    },
    {
      id: 2,
      createdAt: dataOraPrecedente,
      value: 21.0,
      sensorMacAddress: "11:11:11:11:11:11",
      sensor: sensor1
    },
    {
      id: 3,
      createdAt: dataAttuale,
      value: 22.0,
      sensorMacAddress: "11:11:11:11:11:11",
      sensor: sensor1
    },
    {
      id: 4,
      createdAt: dataDueOrePrec,
      value: 1.0,
      sensorMacAddress: "33:33:33:33:33:33",
      sensor: sensor3
    },
    {
      id: 5,
      createdAt: dataOraPrecedente,
      value: 1.0,
      sensorMacAddress: "33:33:33:33:33:33",
      sensor: sensor3
    },
    {
      id: 6,
      createdAt: dataAttuale,
      value: 1.0,
      sensorMacAddress: "33:33:33:33:33:33",
      sensor: sensor3
    },{
      id: 7,
      createdAt: dataAttuale,
      value: 1.0,
      sensorMacAddress: "33:33:33:33:33:33",
      sensor: sensor3
    },{
      id: 8,
      createdAt: dataAttuale,
      value: 1.0,
      sensorMacAddress: "33:33:33:33:33:33",
      sensor: sensor3
    },{
      id: 9,
      createdAt: dataAttuale,
      value: 1.0,
      sensorMacAddress: "33:33:33:33:33:33",
      sensor: sensor3
    },{
      id: 10,
      createdAt: dataAttuale,
      value: 1.0,
      sensorMacAddress: "33:33:33:33:33:33",
      sensor: sensor3
    },{
      id: 11,
      createdAt: dataAttuale,
      value: 1.0,
      sensorMacAddress: "33:33:33:33:33:33",
      sensor: sensor3
    },{
      id: 12,
      createdAt: dataAttuale,
      value: 1.0,
      sensorMacAddress: "33:33:33:33:33:33",
      sensor: sensor3
    },{
      id: 13,
      createdAt: dataAttuale,
      value: 50.0,
      sensorMacAddress: "33:33:33:33:33:33",
      sensor: sensor3
    },
  ];

  return measurementDAOArray
}

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

it("groupAndComputeMeasurements: tutto ok, chiamata base", async () => {
  const existingMacs = [
  "11:11:11:11:11:11",
  "22:22:22:22:22:22",
  "33:33:33:33:33:33",
];

const dataAttuale = new Date();
const dataOraPrecedente = new Date(dataAttuale.getTime() - 60 * 60 * 1000);
const dataDueOrePrec = new Date(dataAttuale.getTime() - 2 * 60 * 60 * 1000);

  const measurementDAO = setupDataForGCM();

  const result = await groupAndComputeMeasurements(measurementDAO, existingMacs);

  const el1 = result.find(el => el.sensorMacAddress === "11:11:11:11:11:11");
  const el3 = result.find(el => el.sensorMacAddress === "33:33:33:33:33:33");

  expect(result.length).toBe(3);
  expect(el1.measurements.length).toBe(3);
  expect(el1.stats).toEqual({
    mean: 21.17,
    variance: 0.39,
    lowerThreshold: 19.92,
    upperThreshold: 22.41,
    startDate: dataDueOrePrec,
    endDate: dataAttuale
  });
  expect(el3.measurements.length).toBe(10);
  expect(el3.stats).toEqual({
    mean: 5.9,
    variance: 216.09,
    lowerThreshold: -23.5,
    upperThreshold: 35.3,
    startDate: dataDueOrePrec,
    endDate: dataAttuale
  })
  expect(el3.measurements[0].isOutlier).toBe(false);
  expect(el3.measurements[1].isOutlier).toBe(false);
  expect(el3.measurements[9].isOutlier).toBe(true);
});

it("groupAndComputeMeasurements: tutto ok, filtro sui mac desiderati", async () => {
  const existingMacs = [
  "11:11:11:11:11:11",
  "22:22:22:22:22:22",
  "33:33:33:33:33:33",
];

const dataAttuale = new Date();
const dataOraPrecedente = new Date(dataAttuale.getTime() - 60 * 60 * 1000);
const dataDueOrePrec = new Date(dataAttuale.getTime() - 2 * 60 * 60 * 1000);

  const measurementDAO = setupDataForGCM();

  const result = await groupAndComputeMeasurements(measurementDAO, existingMacs, ["11:11:11:11:11:11"]);

  const el1 = result.find(el => el.sensorMacAddress === "11:11:11:11:11:11");

  expect(result.length).toBe(1);
  expect(el1.measurements.length).toBe(3);
  expect(el1.stats).toEqual({
    mean: 21.17,
    variance: 0.39,
    lowerThreshold: 19.92,
    upperThreshold: 22.41,
    startDate: dataDueOrePrec,
    endDate: dataAttuale
  });
});


});
