import { Sensor as SensorDTO } from "@dto/Sensor";
import { SensorRepository } from "@repositories/SensorRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";

export async function updateSensorService(networkCode: string, gatewayMac: string, sensorMac: string, sensor: SensorDTO): Promise<void> {
    const sensorRepo = new SensorRepository();
    const gatewayRepo = new GatewayRepository();

    const gateway = await gatewayRepo.getGatewayByMacAddress(networkCode, gatewayMac);
    // Recupera i dati attuali del sensore per quel gateway
    const oldSensor = await sensorRepo.getSensorByMacAddress(gateway.macAddress, sensorMac);

    // Riempie i campi mancanti con i valori già presenti
    if (sensor.macAddress === undefined) sensor.macAddress = oldSensor.macAddress;
    if (sensor.name === undefined) sensor.name = oldSensor.name;
    if (sensor.description === undefined) sensor.description = oldSensor.description;
    if (sensor.variable === undefined) sensor.variable = oldSensor.variable;
    if (sensor.unit === undefined) sensor.unit = oldSensor.unit;

    // Aggiorna il sensore con i nuovi valori (o quelli già presenti)
    await sensorRepo.updateSensor(gateway.macAddress, sensorMac, sensor.macAddress, sensor.name, sensor.description, sensor.variable, sensor.unit);
}