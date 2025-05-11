import { Column, Entity, ManyToOne, PrimaryColumn, JoinColumn} from "typeorm";
import { MeasurementsDAO } from "./MeasurementsDAO";

@Entity("measurement")
export class MeasurementDAO {

  @PrimaryColumn({ nullable: false })
  id: number;

  @Column({ nullable: false })
  createdAt: Date; 

  @Column({ nullable: false })
  value: number;

  @Column({ nullable: true })
  isOutlier: boolean;

  @ManyToOne(()=> MeasurementsDAO, (measurements) => measurements.measurement)
  @JoinColumn({ name: "id", referencedColumnName: "id" })
  measurements: MeasurementsDAO;
}