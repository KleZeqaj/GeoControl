import { SensorRepository } from "@repositories/SensorRepository";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";

const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();
const mockUpdate = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      find: mockFind,
      save: mockSave,
      remove: mockRemove,
      update: mockUpdate
    })
  }
}));

describe("SensorRepository - Mocked", () => {
  const repo = new SensorRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createSensor should call save with correct data", async () => {
    const gateway = new GatewayDAO();
    gateway.macAddress = "GW-TEST";

    mockFind.mockResolvedValueOnce([]); // no conflict
    mockSave.mockResolvedValueOnce({ macAddress: "SENS-01", gatewayMac: "GW-TEST" });

    const result = await repo.createSensor("SENS-01", gateway);

    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
      macAddress: "SENS-01",
      gatewayMac: "GW-TEST"
    }));
    expect(result.macAddress).toBe("SENS-01");
  });

  it("createSensor throws if mac already exists", async () => {
    const gateway = new GatewayDAO();
    gateway.macAddress = "GW-TEST";

    mockFind.mockResolvedValueOnce([{ macAddress: "SENS-EXIST" }]);

    await expect(repo.createSensor("SENS-EXIST", gateway)).rejects.toThrow("already exists");
  });

  it("getSensorByMacAddress returns sensor", async () => {
    const sensor = new SensorDAO();
    sensor.macAddress = "SENS-02";

    mockFind.mockResolvedValueOnce([sensor]);

    const result = await repo.getSensorByMacAddress("SENS-02");

    expect(result.macAddress).toBe("SENS-02");
  });

  it("getSensorByMacAddress throws if not found", async () => {
    mockFind.mockResolvedValueOnce([]);

    await expect(repo.getSensorByMacAddress("MISSING")).rejects.toThrow("not found");
  });

  it("getAllSensors returns sensors for gateway", async () => {
    const sensor = new SensorDAO();
    sensor.macAddress = "SENS-03";

    mockFind.mockResolvedValueOnce([sensor]);

    const result = await repo.getAllSensors("GW-MAC");

    expect(result[0].macAddress).toBe("SENS-03");
  });

  it("deleteSensor should call remove", async () => {
    const sensor = new SensorDAO();
    sensor.macAddress = "SENS-04";

   
    mockFind.mockResolvedValueOnce([sensor]) // getSensorByMacAddress
    mockFind.mockResolvedValueOnce(undefined); // remove

    await repo.deleteSensor("SENS-04");

    expect(mockRemove).toHaveBeenCalledWith(sensor);
  });

  it("updateSensor should call update with new values", async () => {
    await repo.updateSensor("GW", "OLD", "NEW", "name", "desc", "var", "unit");

    expect(mockUpdate).toHaveBeenCalledWith(
      { macAddress: "OLD" },
      { macAddress: "NEW", name: "name", description: "desc", variable: "var", unit: "unit" }
    );
  });
});
