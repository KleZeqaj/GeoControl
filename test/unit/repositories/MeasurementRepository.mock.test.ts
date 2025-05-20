import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

const mockFind = jest.fn();
const mockSave = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      find: mockFind,
      save: mockSave
    })
  }
}));

describe("MeasurementRepository (mocked DB)", () => {
  const repo = new MeasurementRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("storeMeasurements saves values correctly", async () => {
    const now = new Date("2024-01-01T10:00:00Z");

    // mock the sensor/gateway/network existence checks
    mockFind.mockResolvedValueOnce([{ code: "NET1" }]) // network check
    mockFind.mockResolvedValueOnce([{ macAddress: "AA:BB:CC" }]) // gateway check
    mockFind.mockResolvedValueOnce([{ macAddress: "11:22:33" }]); // sensor check

    const mockM = new MeasurementDAO();
    mockM.sensorMacAddress = "11:22:33";
    mockM.value = 50;
    mockM.createdAt = now;

    mockSave.mockResolvedValue([mockM]);

    const values = new Map<Date, number>([[now, 50]]);
    const result = await repo.storeMeasurements("NET1", "AA:BB:CC", "11:22:33", values);

    expect(mockFind).toHaveBeenCalledTimes(3); // network, gateway, sensor
    expect(mockSave).toHaveBeenCalled();
    expect(result[0].value).toBe(50);
    expect(result[0].sensorMacAddress).toBe("11:22:33");
  });

  it("getAllMeasurementsOfSensor returns filtered results", async () => {
    const now = new Date();

    mockFind.mockResolvedValueOnce([{ code: "NET1" }]) // network
    mockFind.mockResolvedValueOnce([{ macAddress: "AA:BB:CC" }]) // gateway
    mockFind.mockResolvedValueOnce([{ macAddress: "11:22:33" }]) // sensor
    mockFind.mockResolvedValueOnce([
        { value: 42, sensor: { macAddress: "11:22:33" }, createdAt: now }
      ]); // final measurement fetch

    const result = await repo.getAllMeasurementsOfSensor("NET1", "AA:BB:CC", "11:22:33");
    expect(result.length).toBe(1);
    expect(result[0].value).toBe(42);
  });

  it("getAllMeasurementsOfNetwork filters by sensorMacs", async () => {
    
    mockFind.mockResolvedValueOnce([{ code: "NET2" }]) // network check
    mockFind.mockResolvedValueOnce([
        { value: 30, sensor: { macAddress: "99:88:77" }, createdAt: new Date() }
      ]); // result

    const result = await repo.getAllMeasurementsOfNetwork("NET2", ["99:88:77"]);
    expect(result.length).toBe(1);
    expect(result[0].sensor.macAddress).toBe("99:88:77");
  });

  it("getValidMacs returns existing MACs", async () => {
    
    mockFind.mockResolvedValueOnce([{ code: "NET3" }]) // network check
    mockFind.mockResolvedValueOnce([
        { macAddress: "66:77:88", gateway: { network: { code: "NET3" } } }
      ]); // found sensors

    const result = await repo.getValidMacs("NET3", ["66:77:88", "00:00:00"]);
    expect(result).toContain("66:77:88");
    expect(result).not.toContain("00:00:00");
  });

  it("getValidMacs returns all MACs if no filter", async () => {
    
    mockFind.mockResolvedValueOnce([{ code: "NET4" }]) // network check
    mockFind.mockResolvedValueOnce([
        { macAddress: "44:55:66", gateway: { network: { code: "NET4" } } }
      ]);

    const result = await repo.getValidMacs("NET4");
    expect(result).toContain("44:55:66");
  });
});
