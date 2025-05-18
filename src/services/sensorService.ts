import { Sensor as SensorDTO } from "@dto/Sensor";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { isValidMAC } from "@utils";

export async function updateSensorService(networkCode: string, gatewayMac: string, sensorMac: string, sensor: SensorDTO): Promise<void> {
    const sensorRepo = new SensorRepository();
    const gatewayRepo = new GatewayRepository();

    const gateway = await gatewayRepo.getGatewayByMacAddress(networkCode, gatewayMac);
    // Recupera i dati attuali del sensore per quel gateway
    const oldSensor = await sensorRepo.getSensorByMacAddress(sensorMac);
//si
    // Riempie i campi mancanti con i valori già presenti
    if (sensor.macAddress !== undefined && sensor.macAddress?.length < 1)
        throw new Error("Sensor macAddress must have a length >= 1!")
    if (sensor.macAddress?.length > 1 && ! isValidMAC(sensor.macAddress))
        throw new Error("New provided macAddress is not a valid macAddress")

    if (sensor.macAddress === undefined) sensor.macAddress = oldSensor.macAddress;
    if (sensor.name === undefined) sensor.name = oldSensor.name;
    if (sensor.description === undefined) sensor.description = oldSensor.description;
    if (sensor.variable === undefined) sensor.variable = oldSensor.variable;
    if (sensor.unit === undefined) sensor.unit = oldSensor.unit;

    // Aggiorna il sensore con i nuovi valori (o quelli già presenti)
    await sensorRepo.updateSensor(gateway.macAddress, sensorMac, sensor.macAddress, sensor.name, sensor.description, sensor.variable, sensor.unit);
}