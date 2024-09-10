import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { ConvidadoEventoModel } from './convidado-evento.model'
import { StatusEvento } from '../entities/evento.entity'

@Entity('evento')
export class EventoModel extends BaseEntity {
    @PrimaryColumn()
    id: string

    @Column()
    nome: string

    @Column()
    status: StatusEvento

    @Column()
    descricao: string

    @Column()
    dt_inicio_prevista: Date

    @Column()
    dt_fim_prevista: Date

    @Column()
    dt_inicio: Date

    @Column()
    dt_fim: Date

    @Column()
    latitude: string

    @Column()
    longitude: string

    @Column()
    local: string

    @Column()
    cpf_organizador: string

    @OneToMany(() => ConvidadoEventoModel, (convidado) => convidado.evento, {
        cascade: true,
        eager: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    convidados: ConvidadoEventoModel[]

    @CreateDateColumn({ name: 'dt_criacao' })
    dt_criacao: Date

    @UpdateDateColumn({ name: 'dt_ult_atualizacao' })
    dt_ult_atualizacao: Date
}
