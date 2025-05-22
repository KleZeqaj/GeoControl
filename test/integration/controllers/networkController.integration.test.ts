import * as networkController from "@controllers/networkController";
import { NetworkDAO } from "@dao/NetworkDAO";
import { NetworkRepository } from "@repositories/NetworkRepository";

jest.mock("@repositories/NetworkRepository");

describe("NetworkController integration", () => {
    it("get Network: mapperService integration", async () => {
        const fakeNetworkDAO: NetworkDAO = {
        id: 1,
        code: "NET01",
        name: "Network 1",
        description: "Description of Network 1",
        gateways: null
        };
    
        const expectedDTO = {
            code: fakeNetworkDAO.code,
            name: fakeNetworkDAO.name,
            description: fakeNetworkDAO.description
        };
    
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
        getNetworkByCode: jest.fn().mockResolvedValue(fakeNetworkDAO)
        }));
    
        const result = await networkController.getNetworkByCode("NET01");
    
        expect(result).toEqual(expectedDTO);
    });

    it("get All Networks: mapperService integration", async () => {
        const fakeNetworkDAOs: NetworkDAO[] = [
            {
                id: 1,
                code: "NET01",
                name: "Network 1",
                description: "Description of Network 1",
                gateways: null
            },
            {
                id: 2,
                code: "NET02",
                name: "Network 2",
                description: "Description of Network 2",
                gateways: null
            }
        ];
    
        const expectedDTOs = fakeNetworkDAOs.map(network => ({
            code: network.code,
            name: network.name,
            description: network.description
        }));
    
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            getAllNetworks: jest.fn().mockResolvedValue(fakeNetworkDAOs)
        }));
    
        const result = await networkController.getAllNetworks();
    
        expect(result).toEqual(expectedDTOs);
    });
    it("create New Network", async () => {
        const fakeNetworkDTO = {
            code: "NET01",
            name: "Network 1",
            description: "Description of Network 1"
        };
    
        const mockCreateNewNetwork = jest.fn().mockResolvedValue(undefined);
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            createNewNetwork: mockCreateNewNetwork
        }));
    
        await networkController.createNewNetwork(fakeNetworkDTO);
    
        expect(mockCreateNewNetwork).toHaveBeenCalledWith(
            fakeNetworkDTO.code, 
            fakeNetworkDTO.name, 
            fakeNetworkDTO.description
        );

    });
    it("update Network", async () => {
        const fakeNetworkDTO = {
            code: "NET01",
            name: "Network 1",
            description: "Description of Network 1"
        };
    
        const mockUpdateNetwork = jest.fn().mockResolvedValue(undefined);
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            updateNetwork: mockUpdateNetwork
        }));
    
        await networkController.updateNetwork(fakeNetworkDTO.code, fakeNetworkDTO);
    
        expect(mockUpdateNetwork).toHaveBeenCalledWith(
            fakeNetworkDTO.code,
            fakeNetworkDTO.code,
            fakeNetworkDTO.name,
            fakeNetworkDTO.description
        );

    });
    it("delete Network", async () => {
        const fakeNetworkCode = "NET01";
    
        const mockDeleteNetwork = jest.fn().mockResolvedValue(undefined);
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            deleteNetwork: mockDeleteNetwork
        }));
    
        await networkController.deleteNetwork(fakeNetworkCode);
    
        expect(mockDeleteNetwork).toHaveBeenCalledWith(fakeNetworkCode);
    });

});