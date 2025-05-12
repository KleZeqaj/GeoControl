import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn} from "typeorm";
import { SensorDAO } from "./SensorDAO";

@Entity("measurement")
export class MeasurementDAO {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  createdAt: Date; 

  @Column({ nullable: false })
  value: number;

  @Column({ nullable: false })
  sensorMacAddress: string;

  @ManyToOne(() => SensorDAO, (sensor) => sensor.measurement)
  @JoinColumn({ name: "sensorMacAddress", referencedColumnName: "macAddress" })
  sensor: SensorDAO;
}