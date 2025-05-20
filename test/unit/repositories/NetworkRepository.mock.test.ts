import { NetworkDAO } from "@models/dao/NetworkDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { NetworkRepository } from "@repositories/NetworkRepository";

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

describe("NetworkRepository (mocked DB)", () => {
  const repo = new NetworkRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw ConflictError if Network code already exists", async () => {
    const existingNetwork = new NetworkDAO();
    existingNetwork.code = "NET00";

    mockFind.mockResolvedValue([existingNetwork]);

    await expect(repo.checkOnNetID("NET00"))
      .rejects
      .toThrow(ConflictError);
  });

  it("should not throw if Network code does not exist", async () => {
    mockFind.mockResolvedValue([]);

    await expect(repo.checkOnNetID("NET00"))
      .resolves
      .toBeUndefined();
  });

  it("should get all networks", async () => {
    const network = new NetworkDAO();
    network.code = "NET00";
    mockFind.mockResolvedValue([network]);

    const result = await repo.getAllNetworks();

    expect(result).toHaveLength(1);
  });

  it("should return network by code", async () => {
    const network = new NetworkDAO();
    network.code = "NET00";
    mockFind.mockResolvedValue([network]);

    const result = await repo.getNetworkByCode("NET00");

    expect(result).toBe(network);
    expect(mockFind).toHaveBeenCalledWith({
      where : { code: "NET00" },
      relations: ["gateways", "gateways.sensors"]
    });
  });

  it("should throw NotFoundError if network not found by code", async () => {
    mockFind.mockResolvedValue([]);

    await expect(
      repo.getNetworkByCode("NET01")
    ).rejects.toThrow(NotFoundError);
  });

  it("should create a new network", async () => {

    const savedNetwork = new NetworkDAO();
    savedNetwork.code = "NET01";
    savedNetwork.name = "Test Network";
    savedNetwork.description = "Test description";

    mockSave.mockResolvedValue(savedNetwork);

    const result = await repo.createNewNetwork(
      "NET01",
      "Test Network",
      "Test description"
    );

    expect(result).toBeInstanceOf(NetworkDAO);
    expect(result).toBe(savedNetwork);
    expect(mockSave).toHaveBeenCalledWith({
      code: "NET01",
      name: "Test Network",
      description: "Test description"
    });
  });


  it("should delete a network", async () => {
    const network = new NetworkDAO();
    network.code = "NET01";
    mockFind.mockResolvedValue([network]);
    mockRemove.mockResolvedValue(undefined);

    await repo.deleteNetwork("NET01");

    expect(mockRemove).toHaveBeenCalledWith(network);
  });


  it("should update a network", async () => {

    const existingNetwork = {
      code: "NET001",
      name: "Old Network",
      description: "Old description"
    };

    mockFind.mockResolvedValueOnce([existingNetwork]);
    mockFind.mockResolvedValueOnce([]);
    mockUpdate.mockResolvedValue([]);
    
    await repo.updateNetwork(
      "NET001",
      "NET002",
      "New Network",
      "New description"
    );
    
    expect(mockFind).toHaveBeenCalledWith({
      where: { code: "NET001" },
      relations: ["gateways", "gateways.sensors"]
    });
    expect(mockUpdate).toHaveBeenCalledWith(
      "NET001",
      {
        code: "NET002",
        name: "New Network",
        description: "New description"
      }
    );
 
  });
});
