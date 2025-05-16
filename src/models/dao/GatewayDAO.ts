import { NetworkDAO } from "@dao/NetworkDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity("gateways")
export class GatewayDAO {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, unique: true })
  macAddress: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => NetworkDAO, (network) => network.gateways, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  network: NetworkDAO

  @OneToMany(() => SensorDAO, (sensor) => sensor.gateway)
  sensors: SensorDAO[]

}