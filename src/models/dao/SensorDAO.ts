import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { GatewayDAO } from "./GatewayDAO";
import { MeasurementDAO } from "./MeasurementDAO";

@Entity("sensors")
export class SensorDAO{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false, unique: true })
    macAddress: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    variable: string;

    @Column({ nullable: true })
    unit: string;

    @Column({ nullable: false })
    gatewayMac: string;

    @ManyToOne(() => GatewayDAO, (gateway) => gateway.sensors, {
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    })
    @JoinColumn({ name: "gatewayMac", referencedColumnName: "macAddress" })
    gateway: GatewayDAO
    
    @OneToMany(() => MeasurementDAO, (measurement) => measurement.sensor)
    measurement: MeasurementDAO[]
}
