import { Sensor as SensorDTO } from "@dto/Sensor";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { mapSensorDAOToDTO } from "@services/mapperService";
import { updateSensorService } from "@services/sensorService";


export async function getAllSensors(networkCode: string, gatewayMac: string): Promise<SensorDTO[]> {
  const gatewayRepo = new GatewayRepository();
  const sensorRepo = new SensorRepository();

  const gateway = await gatewayRepo.getGatewayByMacAddress(networkCode, gatewayMac);
  const sensors = await sensorRepo.getAllSensors(gateway.macAddress);

  return sensors.map(mapSensorDAOToDTO);
}

export async function getSensor(networkCode: string, gatewayMac: string, sensorMac: string): Promise<SensorDTO> {
  const gatewayRepo = new GatewayRepository();
  const sensorRepo = new SensorRepository();

  const gateway = await gatewayRepo.getGatewayByMacAddress(networkCode, gatewayMac);
  const sensor = await sensorRepo.getSensorByMacAddress(sensorMac);

  return mapSensorDAOToDTO(sensor);
}

export async function createSensor(networkCode: string, gatewayMac: string, sensorDto: SensorDTO): Promise<void> {
  const gatewayRepo = new GatewayRepository();
  const sensorRepo = new SensorRepository();

  const gateway = await gatewayRepo.getGatewayByMacAddress(networkCode, gatewayMac);
  await sensorRepo.createSensor(
    sensorDto.macAddress,
    gateway,
    sensorDto.name,
    sensorDto.description,
    sensorDto.variable,
    sensorDto.unit
  );
}


export async function deleteSensor(networkCode: string, gatewayMac: string, sensorMac: string): Promise<void> {
  const gatewayRepo = new GatewayRepository();
  const sensorRepo = new SensorRepository();

  const gateway = await gatewayRepo.getGatewayByMacAddress(networkCode, gatewayMac);
  await sensorRepo.deleteSensor(sensorMac);
}

// Aggiorna un sensore dopo aver validato il gateway e il network
export async function updateSensor(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string,
  sensorDto: SensorDTO
): Promise<void> {
  //const gatewayRepo = new GatewayRepository();

  //const gateway = await gatewayRepo.getGatewayByMacAddress(networkCode, gatewayMac);
  await updateSensorService(networkCode, gatewayMac, sensorMac, sensorDto);
}

