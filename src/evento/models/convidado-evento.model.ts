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

    @ManyToOne(() => EventoModel, (evento) => evento.convidados)
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
