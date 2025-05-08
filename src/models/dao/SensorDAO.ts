import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { GatewayDAO } from "./GatewayDAO";
import { MeasurementsDAO } from "./MeasurementsDAO";

@Entity("sensors")
export class SensorDAO{
    @PrimaryColumn({ nullable: false })
    macAddress: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    variable: string;

    @Column({ nullable: true })
    unit: string;

    @ManyToOne(() => GatewayDAO, (gateway) => gateway.sensors)
    gateway: GatewayDAO
    
    @OneToMany(() => MeasurementsDAO, (measurements) => measurements.sensor)
    measurements: MeasurementsDAO[]
}
