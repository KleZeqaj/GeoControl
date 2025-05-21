import { GatewayDAO } from "@dao/GatewayDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { SensorRepository } from "@repositories/SensorRepository";

const mockFind = jest.fn();
const mockSave = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      find: mockFind,
      save: mockSave,
      update: mockUpdate,
      remove: mockRemove
    })
  }
}));

describe("SensorRepository: mocked database", () => {
  const repo = new SensorRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("get sensor", async () => {

    const validMacAddress = "FF:FF:FF:FF:FF:FF";

    const testSensor = new SensorDAO();
    testSensor.macAddress = validMacAddress;
    testSensor.gatewayMac = "FF:FF:FF:FF:FF:FE";
    testSensor.description = "ProvaDescrizione";
    testSensor.name = "TH01";
    testSensor.unit = "C";
    testSensor.variable = "temperature";

    mockFind.mockResolvedValue([testSensor]);

    const result = await repo.getSensorByMacAddress(validMacAddress);

    expect(result).toBeInstanceOf(SensorDAO);
    expect(result.macAddress).toBe("FF:FF:FF:FF:FF:FF");
    expect(result.gatewayMac).toBe("FF:FF:FF:FF:FF:FE");
    expect(result.description).toBe("ProvaDescrizione");
    expect(result.name).toBe("TH01");
    expect(result.unit).toBe("C");
    expect(result.variable).toBe("temperature");
  });

  it("get non-existent sensor", async () => {

    mockFind.mockResolvedValue([]);

    await expect(repo.getSensorByMacAddress("invalidMacAddress")).rejects.toThrow(NotFoundError);
    
  });

  it("get all sensors", async () => {

    const testSensor1 = new SensorDAO();
    testSensor1.macAddress = "FF:FF:FF:FF:FF:FF";
    testSensor1.gatewayMac = "FF:FF:FF:FF:FF:FE";
    testSensor1.description = "ProvaDescrizione1";
    testSensor1.name = "TH01";
    testSensor1.unit = "C";
    testSensor1.variable = "temperature";

    const testSensor2 = new SensorDAO();
    testSensor2.macAddress = "FF:FF:FF:FF:FF:EE";
    testSensor2.gatewayMac = "FF:FF:FF:FF:FF:FE";
    testSensor2.description = "ProvaDescrizione2";
    testSensor2.name = "TH02";
    testSensor2.unit = "C";
    testSensor2.variable = "temperature";

    const testSensor3 = new SensorDAO();
    testSensor3.macAddress = "FF:FF:FF:FF:FF:DD";
    testSensor3.gatewayMac = "FF:FF:FF:FF:FF:DA";
    testSensor3.description = "ProvaDescrizione3";
    testSensor3.name = "TH03";
    testSensor3.unit = "C";
    testSensor3.variable = "temperature";

    mockFind.mockResolvedValue([testSensor1, testSensor2]);

    const result = await repo.getAllSensors("FF:FF:FF:FF:FF:FE");

    expect(Array.isArray(result)).toBe(true);
    result.forEach(item => {
        expect(item).toBeInstanceOf(SensorDAO);
        expect(item.gatewayMac).toBe("FF:FF:FF:FF:FF:FE")
    });
    expect(result.length).toBe(2);
    expect(result[0]).toBe(testSensor1);
    expect(result[1]).toBe(testSensor2);
  });

  it("get all sensors empty", async () => {
    mockFind.mockResolvedValue([]);

    const result = await repo.getAllSensors("FF:FF:FF:FF:FF:DA");

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
    
  });

  it("create sensor", async () => {
    mockFind.mockResolvedValue([]);

    const testGateway = new GatewayDAO();
    testGateway.macAddress = "FF:FF:FF:FF:FF:FE";
    testGateway.netID = "NET01";

    const testSensor = new SensorDAO();
    testSensor.macAddress = "FF:FF:FF:FF:FF:FF";
    testSensor.gatewayMac = "FF:FF:FF:FF:FF:FE";
    testSensor.gateway = testGateway;
    testSensor.description = "ProvaDescrizione";
    testSensor.name = "TH01";
    testSensor.unit = "C";
    testSensor.variable = "temperature";

    mockSave.mockResolvedValue(testSensor);

    const result = await repo.createSensor("FF:FF:FF:FF:FF:FF",
        testGateway,
        "TH01",
        "ProvaDescrizione",
        "temperature",
        "C");

    expect(result).toBeInstanceOf(SensorDAO);
    expect(result.macAddress).toBe("FF:FF:FF:FF:FF:FF");
    expect(result.gatewayMac).toBe("FF:FF:FF:FF:FF:FE");
    expect(result.description).toBe("ProvaDescrizione");
    expect(result.name).toBe("TH01");
    expect(result.unit).toBe("C");
    expect(result.variable).toBe("temperature");
    expect(mockSave).toHaveBeenCalledWith({
        macAddress: "FF:FF:FF:FF:FF:FF",
        gatewayMac: "FF:FF:FF:FF:FF:FE",
        name: "TH01",
        description: "ProvaDescrizione",
        variable: "temperature",
        unit: "C"
    });
  });

  it("create sensor: conflict", async () => {

    const testGateway = new GatewayDAO();
    testGateway.macAddress = "FF:FF:FF:FF:FF:FE";
    testGateway.netID = "NET01";

    const testGateway2 = new GatewayDAO();
    testGateway.macAddress = "FF:FF:FF:FF:FF:AA";
    testGateway.netID = "NET02";

    const testSensor = new SensorDAO();
    testSensor.macAddress = "FF:FF:FF:FF:FF:FF";
    testSensor.gatewayMac = "FF:FF:FF:FF:FF:FE";
    testSensor.gateway = testGateway;
    testSensor.description = "ProvaDescrizione6";
    testSensor.name = "TH03";
    testSensor.unit = "F";
    testSensor.variable = "temperature";

    mockFind.mockResolvedValue([testSensor]);

    await expect(repo.createSensor("FF:FF:FF:FF:FF:FF",
        testGateway2,
        "TH01",
        "ProvaDescrizione",
        "temperature",
        "C")).rejects.toThrow(ConflictError);
  });


  it("delete sensor", async () => {

    const testGateway = new GatewayDAO();
    testGateway.macAddress = "FF:FF:FF:FF:FF:FE";
    testGateway.netID = "NET01";

    const testSensor = new SensorDAO();
    testSensor.macAddress = "FF:FF:FF:FF:FF:FF";
    testSensor.gatewayMac = "FF:FF:FF:FF:FF:FE";
    testSensor.gateway = testGateway;
    testSensor.description = "ProvaDescrizione1";
    testSensor.name = "TH01";
    testSensor.unit = "C";
    testSensor.variable = "temperature";

    mockFind.mockResolvedValue([testSensor]);
    mockRemove.mockResolvedValue([testSensor]);

    await repo.deleteSensor("FF:FF:FF:FF:FF:FF");
    expect(mockRemove).toHaveBeenCalledWith(testSensor);
  });

  it("delete sensor: sensor NotFound", async () => {
    const testGateway = new GatewayDAO();
    testGateway.macAddress = "FF:FF:FF:FF:FF:FE";
    testGateway.netID = "NET01";

    const testSensor = new SensorDAO();
    testSensor.macAddress = "FF:FF:FF:FF:FF:FF";
    testSensor.gatewayMac = "FF:FF:FF:FF:FF:FE";
    testSensor.gateway = testGateway;
    testSensor.description = "ProvaDescrizione1";
    testSensor.name = "TH01";
    testSensor.unit = "C";
    testSensor.variable = "temperature";

    mockFind.mockResolvedValue([]);

    await expect(repo.deleteSensor("FF:FF:FF:FF:FF:AA")).rejects.toThrow(NotFoundError);
  });


  it("update sensor", async () => {
    const oldMac = "FF:FF:FF:FF:FF:FF";
    const newMac = "11:22:33:44:55:66";
    const gatewayMac = "FF:FF:FF:FF:FF:FE";
    const newName = "TH10";
    const newDescription = "ProvaDescrizioneAgg";
    const newVariable = "temperature";
    const newUnit = "C";

    mockUpdate.mockResolvedValue({ affected: 1 });

    await repo.updateSensor(
        gatewayMac,
        oldMac,
        newMac,
        newName,
        newDescription,
        newVariable,
        newUnit
    );

    expect(mockUpdate).toHaveBeenCalledWith(
    { macAddress: oldMac },
    {
      macAddress: newMac,
      name: newName,
      description: newDescription,
      variable: newVariable,
      unit: newUnit
    });
    });

    it("update sensor not found", async () => {
        const oldMac = "FF:FF:FF:FF:FF:FF";
        const newMac = "11:22:33:44:55:66";
        const gatewayMac = "FF:FF:FF:FF:FF:FE";
        const newName = "TH10";
        const newDescription = "ProvaDescrizioneAgg";
        const newVariable = "temperature";
        const newUnit = "C";

        mockUpdate.mockResolvedValue({ affected: 0 });
        await expect(repo.updateSensor(
            gatewayMac, 
            oldMac, 
            newMac, 
            newName, 
            newDescription, 
            newVariable, 
            newUnit)).resolves.toBeUndefined();
            expect(mockUpdate).toHaveBeenCalled();
    });
});
