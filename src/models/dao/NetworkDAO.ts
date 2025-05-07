import { Column, Entity, PrimaryColumn } from "typeorm";


@Entity("networks")
export class NetworkDAO {
  @PrimaryColumn({ nullable: false })
  code: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;

  
}