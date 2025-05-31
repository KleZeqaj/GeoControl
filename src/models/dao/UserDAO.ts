import { UserType } from "@models/UserType";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("users")
export class UserDAO {
  @PrimaryColumn({ nullable: false })
  username: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false })
  type: UserType;
}
