import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, UpdateDateColumn } from 'typeorm'
import { EventoModel } from './evento.model'
import { CheckInsModel } from './check-ins.model'

export interface ConvidadoEvento {
    email: string
    id_evento: string
    check_ins: CheckInsModel[]
}

@Entity('convidado_evento')
export class ConvidadoEventoModel extends BaseEntity {
    @Column({ name: 'email_convidado', nullable: false, primary: true })
    email: string

    @Column({ name: 'id_evento', nullable: false, primary: true })
    id_evento: string

    @Column({ name: 'check_ins', type: 'json', nullable: false, default: () => "'[]'" })
    check_ins: CheckInsModel[]

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
