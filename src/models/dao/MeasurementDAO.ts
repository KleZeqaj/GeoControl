import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn} from "typeorm";
import { SensorDAO } from "./SensorDAO";

@Entity("measurement")
export class MeasurementDAO {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({
  type: 'text',
  nullable: false,
  transformer: {
    to: (value: Date) => value.toISOString().split('.')[0] + 'Z',
    from: (value: string) => new Date(value),
  }
})
  createdAt: Date; 

  @Column({ type: "double" ,nullable: false })
  value: number;

  @Column({ nullable: false })
  sensorMacAddress: string;

  @ManyToOne(() => SensorDAO, (sensor) => sensor.measurement,{onDelete:"CASCADE",onUpdate:"CASCADE"})
  @JoinColumn({ name: "sensorMacAddress", referencedColumnName: "macAddress" })
  sensor: SensorDAO;
}