import { GatewayDAO } from "@dao/GatewayDAO";
import { Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";


@Entity("networks")
export class NetworkDAO {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, unique: true })
  code: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => GatewayDAO, (gateway) => gateway.network)
  gateways: GatewayDAO []

  
}