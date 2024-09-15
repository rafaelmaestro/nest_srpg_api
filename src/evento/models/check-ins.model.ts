import { BaseEntity, Column } from 'typeorm'

export class CheckInsModel extends BaseEntity {
    @Column({ name: 'id', nullable: false, primary: true })
    id: string

    @Column()
    dt_hora_check_in: Date

    @Column()
    dt_hora_check_out: Date
}
