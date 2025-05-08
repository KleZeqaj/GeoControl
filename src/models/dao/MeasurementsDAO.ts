import { Column, Entity, OneToMany, PrimaryColumn, ManyToOne, JoinColumn, OneToOne} from "typeorm";
import { MeasurementDAO } from "./MeasurementDAO";
import { StatsDAO } from "./StatsDAO";
import { SensorDAO } from "./SensorDAO";

@Entity("measurements")
export class MeasurementsDAO {

  @PrimaryColumn({ nullable: false })
  sensorMacAddress: string;

  @OneToOne(() => StatsDAO, (stats) => stats.measurements)
  stats: StatsDAO;

  @OneToMany(() => MeasurementDAO, (measurement) => measurement.measurements)
  measurement: MeasurementDAO[];

  @ManyToOne(() => SensorDAO, (sensor) => sensor.measurements)
  @JoinColumn({ name: "sensorMacAddress", referencedColumnName: "macAddress" })
  sensor: SensorDAO;
}