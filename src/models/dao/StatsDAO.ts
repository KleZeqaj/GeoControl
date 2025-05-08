import { Column, Entity, OneToMany, PrimaryColumn, ManyToOne, JoinColumn, OneToOne} from "typeorm";
import { MeasurementsDAO } from "./MeasurementsDAO";


@Entity("stats")
export class StatsDAO {

  @PrimaryColumn({ nullable: false })
  sensorMacAddress: string;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: false })
  mean: number; 

  @Column({ nullable: false })
  variance: number;

  @Column({ nullable: false })
  upperTreshold: number;

  @Column({ nullable: false })
  lowerTreshold: number;

  @OneToOne(() => MeasurementsDAO, (measurements) => measurements.stats)
  @JoinColumn({ name: "sensorMacAddress", referencedColumnName: "sensorMacAddress" })
  measurements: MeasurementsDAO;
}