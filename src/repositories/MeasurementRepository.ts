import { AppDataSource } from "@database";
import { MeasurementsDAO } from "@models/dao/MeasurementsDAO";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { StatsDAO } from "@models/dao/StatsDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { Repository } from "typeorm";
import { NotFoundError } from "@models/errors/NotFoundError";

//Per ricevere le misurazioni di senso è necessario sensorRepository e sensorDAO

export class MeasurementRepository {
    private repo: Repository<MeasurementsDAO>;
    //const sensorRepo = new SensorRepository();

    constructor() {
        this.repo = AppDataSource.getRepository(MeasurementsDAO);
    }

    getAllMeasurements() : Promise<MeasurementsDAO[]>{
        return this.repo.find();
    }

    async getAllMeasurementsOfSensor(macAddress: string) : Promise<MeasurementsDAO[]> {
          //let sensorDAO: SensorDAO;
          try {
            //sensorDAO = await sensorDAO.getSensorByMAC(macAddress);
          } catch (error) {
            throw new NotFoundError (
              `Not Found: sensor mac ${macAddress} not found`
            );
        }
            return await this.repo.find({ where: { sensorMacAddress: macAddress } });
    }
}