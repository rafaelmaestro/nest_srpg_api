import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, UpdateDateColumn } from 'typeorm'
import { EventoModel } from './evento.model'

export interface ConvidadoEvento {
    email: string
    id_evento: string
}

@Entity('convidado_evento')
export class ConvidadoEventoModel extends BaseEntity {
    @Column({ name: 'email_convidado', nullable: false, primary: true })
    email: string

    @Column({ name: 'id_evento', nullable: false, primary: true })
    id_evento: string

    @Column()
    dt_hora_check_in: Date

    @Column()
    dt_hora_check_out: Date

    @ManyToOne(() => EventoModel, (evento) => evento.convidados, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'id_evento', referencedColumnName: 'id' })
    evento: EventoModel

    @CreateDateColumn({ name: 'dt_criacao' })
    dt_criacao: Date

    @UpdateDateColumn({ name: 'dt_ult_atualizacao' })
    dt_ult_atualizacao: Date

    build(convidado: ConvidadoEvento) {
        return Object.assign(this, convidado)
    }
}
