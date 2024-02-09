import { Entity, Column } from "typeorm"
import { CloudBaseEntity } from "./CloudBaseEntity.js"

@Entity()
export class User extends CloudBaseEntity {

    @Column("varchar", {nullable: false})
    username!: string

    @Column("varchar", {nullable: false})
    password!: string

    @Column("varchar", {nullable: false})
    first_name!: string

    @Column("varchar", {nullable: false})
    last_name!: string

}
