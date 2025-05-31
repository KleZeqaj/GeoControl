import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { GatewayRepository } from "@repositories/GatewayRepository";

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

describe("GatewayRepository (mocked DB)", () => {
  const repo = new GatewayRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw ConflictError if MAC already exists", async () => {
    const existingGateway = new GatewayDAO();
    existingGateway.macAddress = "AA:BB:CC:DD:EE:FF";

    mockFind.mockResolvedValue([existingGateway]);

    await expect(repo.isMacAlreadyPresent("AA:BB:CC:DD:EE:FF"))
      .rejects
      .toThrow(ConflictError);
  });

  it("should not throw if MAC does not exist", async () => {
    mockFind.mockResolvedValue([]);

    await expect(repo.isMacAlreadyPresent("11:22:33:44:55:66"))
      .resolves
      .toBeUndefined();
  });

  it("must throw if MAC already exist", async () => {
      const gateway = new GatewayDAO();
      gateway.macAddress = "AA:BB:CC:DD:EE:FF";

      mockFind.mockResolvedValue([gateway]);

      await expect(repo.isMacAlreadyPresent("AA:BB:CC:DD:EE:FF"))
            .rejects.toThrow(ConflictError);
  })

  it("should get all gateways for a network", async () => {
    const gateway = new GatewayDAO();
    gateway.macAddress = "00:11:22:33:44:55";
    mockFind.mockResolvedValue([gateway]);

    const result = await repo.getAllGateways("NET01");

    expect(result).toHaveLength(1);
    expect(mockFind).toHaveBeenCalledWith({
      where: { network: { code: "NET01" } },
      relations: ["network", "sensors"]
    });
  });

  it("should return gateway by MAC address", async () => {
    const gateway = new GatewayDAO();
    gateway.macAddress = "11:22:33:44:55:66";
    mockFind.mockResolvedValue([gateway]);

    const result = await repo.getGatewayByMacAddress("NET01", "11:22:33:44:55:66");

    expect(result).toBe(gateway);
    expect(mockFind).toHaveBeenCalledWith({
      where: { network: { code: "NET01" }, macAddress: "11:22:33:44:55:66" },
      relations: ["network", "sensors"]
    });
  });

  it("should throw NotFoundError if gateway not found by MAC", async () => {
    mockFind.mockResolvedValue([]);

    await expect(
      repo.getGatewayByMacAddress("NET01", "00:00:00:00:00:00")
    ).rejects.toThrow(NotFoundError);
  });

  it("should create a new gateway", async () => {
    const network = new NetworkDAO();
    network.code = "NET01";

    const savedGateway = new GatewayDAO();
    savedGateway.macAddress = "AA:BB:CC:DD:EE:FF";
    savedGateway.name = "Gateway 1";
    savedGateway.description = "Test gateway";
    savedGateway.network = network;

    mockFind.mockResolvedValue([]);
    mockSave.mockResolvedValue(savedGateway);

    const result = await repo.createGateway(
      "AA:BB:CC:DD:EE:FF",
      "Gateway 1",
      "Test gateway",
      network
    );

    expect(result).toBe(savedGateway);
    expect(mockSave).toHaveBeenCalledWith({
      macAddress: "AA:BB:CC:DD:EE:FF",
      name: "Gateway 1",
      description: "Test gateway",
      network
    });
  });

  it("should delete a gateway", async () => {
    const gateway = new GatewayDAO();
    gateway.macAddress = "AA:BB:CC:DD:EE:FF";
    mockFind.mockResolvedValue([gateway]);
    mockRemove.mockResolvedValue(undefined);

    await repo.deleteGateway("NET01", "AA:BB:CC:DD:EE:FF");

    expect(mockRemove).toHaveBeenCalledWith(gateway);
  });

  
  it("should update a gateway", async () => {

    const existingGateway = {
      macAddress: "AA:BB:CC:DD:EE:FF",
      name: "GW01",
      description: "desc"
    }
    mockFind.mockResolvedValueOnce([existingGateway]);
    mockFind.mockResolvedValueOnce([]);
    mockUpdate.mockResolvedValue([]);

    await repo.updateGateway(
      "NET01",
      "AA:BB:CC:DD:EE:FF",
      "CC:DD:EE:FF:99:II",
      "New Gateway",
      "Updated description"
    );

    expect(mockUpdate).toHaveBeenCalledWith(
      { macAddress: "AA:BB:CC:DD:EE:FF" },
      {
        macAddress: "CC:DD:EE:FF:99:II",
        name: "New Gateway",
        description: "Updated description"
      }
    );
  });
});
