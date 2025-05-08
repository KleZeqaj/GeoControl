import { Column, Entity, ManyToOne, PrimaryColumn, JoinColumn} from "typeorm";
import { MeasurementsDAO } from "./MeasurementsDAO";

@Entity("measurement")
export class MeasurementDAO {

  @PrimaryColumn({ nullable: false })
  sensorMacAddress: string;

  @Column({ nullable: true })
  createdAt: Date; 

  @Column({ nullable: true })
  value: string;

  @Column({ nullable: true })
  isOutlier: boolean;

  @ManyToOne(()=> MeasurementsDAO, (measurements) => measurements.measurement)
  @JoinColumn({ name: "sensorMacAddress", referencedColumnName: "sensorMacAddress" })
  measurements: MeasurementsDAO;
}