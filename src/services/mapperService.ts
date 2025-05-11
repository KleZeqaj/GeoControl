import { Measurements as MeasurementsDTO } from "@dto/Measurements";
import { Network as NetworkDTO } from "@dto/Network";
import { Stats as StatsDTO } from "@dto/Stats";
import { Token as TokenDTO } from "@dto/Token";
import { User as UserDTO } from "@dto/User";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { MeasurementsDAO } from "@models/dao/MeasurementsDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
import { StatsDAO } from "@models/dao/StatsDAO";
import { UserDAO } from "@models/dao/UserDAO";
import { ErrorDTO } from "@models/dto/ErrorDTO";
import { Gateway as GatewayDTO } from "@models/dto/Gateway";
import { Measurement as MeasurementDTO } from "@models/dto/Measurement";
import { Sensor as SensorDTO } from "@models/dto/Sensor";
import { UserType } from "@models/UserType";

export function createErrorDTO(
  code: number,
  message?: string,
  name?: string
): ErrorDTO {
  return removeNullAttributes({
    code,
    name,
    message
  }) as ErrorDTO;
}

export function createTokenDTO(token: string): TokenDTO {
  return removeNullAttributes({
    token: token
  }) as TokenDTO;
}

export function createUserDTO(
  username: string,
  type: UserType,
  password?: string
): UserDTO {
  return removeNullAttributes({
    username,
    type,
    password
  }) as UserDTO;
}

export function mapUserDAOToDTO(userDAO: UserDAO): UserDTO {
  return createUserDTO(userDAO.username, userDAO.type);
}

function removeNullAttributes<T>(dto: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(dto).filter(
      ([_, value]) =>
        value !== null &&
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0)
    )
  ) as Partial<T>;
}


/*  NETWORK MAPPING  */

export function createSensorDTO(macAddress: string, name?: string, description?: string, variable?: string, unit?: string) : SensorDTO {
  return removeNullAttributes({
    macAddress,
    name,
    description,
    variable,
    unit
  }) as SensorDTO;
}

export function mapSensorDAOToDTO(sensor: SensorDAO) : SensorDTO{
  return createSensorDTO(sensor.macAddress, sensor.name, sensor.description, sensor.variable, sensor.unit);
}

export function createGatewayDTO(macAddress: string, name?: string, description?: string, sensors?: Array<SensorDAO>) : GatewayDTO {
  let sensorsDTO : Array<SensorDTO>;

  if (sensors !== undefined){
    for (let i = 0; i < sensors?.length; i++){
      sensorsDTO.push(mapSensorDAOToDTO(sensors[i]));
    }
  }
  

  return removeNullAttributes({
    macAddress,
    name,
    description,
    sensorsDTO
  }) as GatewayDTO;
}



export function mapGatewayDAOToDTO(gateway: GatewayDAO) : GatewayDTO{
  return createGatewayDTO(gateway.macAddress, gateway.name, gateway.description, gateway.sensors);
}


export function createNetworkDTO(code: string, name?: string, description?: string,  gateways?: Array<GatewayDAO>) : NetworkDTO {
  
  let gatewaysDTO : Array<GatewayDTO>;

  if (gateways !== undefined){
    for (let i = 0; i < gateways?.length; i++){
      gatewaysDTO.push(mapGatewayDAOToDTO(gateways[i])); 
    }
  }
  

  return removeNullAttributes({
    code, 
    name, 
    description, 
    gatewaysDTO
  }) as NetworkDTO;
}



export function mapNetworkDAOToDTO(networkDAO: NetworkDAO): NetworkDTO{
  return createNetworkDTO(networkDAO.code, networkDAO.name, networkDAO.description);
}

/* MEASUREMENTS MAPPING */

export function createMeasurementsDTO(
  id: number,
  sensorMacAddress: string,
  stats?: StatsDAO,
  measurement?: MeasurementDAO[]
): MeasurementsDTO {

  let measurementDTO: Array<MeasurementDTO>;
  let statsDTO: StatsDTO;
  
  if (stats) {
    statsDTO = mapStatsDAOToDTO(stats);
  }

  for (let i = 0; i < measurement.length; i++){
    measurementDTO.push(mapMeasurementDAOToDTO(measurement[i]));
  }

  return removeNullAttributes({
    id,
    sensorMacAddress,
    statsDTO,
    measurementDTO
  }) as MeasurementsDTO;
}

export function mapMeasurementsDAOToDTO(measurementsDAO: MeasurementsDAO): MeasurementsDTO {
  return createMeasurementsDTO(
    measurementsDAO.id,
    measurementsDAO.sensorMacAddress,
    measurementsDAO.stats,
    measurementsDAO.measurement
  );
}

export function createMeasurementDTO(
  id: number,
  createdAt: Date,
  value: number,
  isOutlier?: boolean
): MeasurementDTO {
  return removeNullAttributes({
    id,
    createdAt,
    value,
    isOutlier
  }) as MeasurementDTO;
}

export function mapMeasurementDAOToDTO(measurementDAO: MeasurementDAO): MeasurementDTO {
  return createMeasurementDTO(
    measurementDAO.id,
    measurementDAO.createdAt,
    measurementDAO.value,
    measurementDAO.isOutlier
  );
}

export function createStatsDTO(
  id: number,
  startDate: Date,
  endDate: Date,
  mean: number,
  variance: number,
  upperTreshold: number,
  lowerTreshold: number
): StatsDTO {
  return removeNullAttributes({
    id,
    startDate,
    endDate,
    mean,
    variance,
    upperTreshold,
    lowerTreshold
  }) as StatsDTO;
}

export function mapStatsDAOToDTO(statsDAO: StatsDAO): StatsDTO {
  return createStatsDTO(
    statsDAO.id,
    statsDAO.startDate,
    statsDAO.endDate,
    statsDAO.mean,
    statsDAO.variance,
    statsDAO.upperTreshold,
    statsDAO.lowerTreshold
  );
}