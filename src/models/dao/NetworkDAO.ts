import { GatewayDAO } from "@dao/GatewayDAO";
import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";


@Entity("networks")
export class NetworkDAO {
  @PrimaryColumn({ nullable: false })
  code: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => GatewayDAO, (gateway) => gateway.network)
  gateways: GatewayDAO []

  
}