import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { ConvidadoEventoModel } from './convidado-evento.model'

@Entity('evento')
export class EventoModel extends BaseEntity {
    @PrimaryColumn()
    id: string

    @Column()
    nome: string

    @Column()
    descricao: string

    @Column()
    data_hora: Date

    @Column()
    latitude: string

    @Column()
    longitude: string

    @Column()
    local: string

    @Column()
    cpf_organizador: string

    @OneToMany(() => ConvidadoEventoModel, (convidado) => convidado.evento, { cascade: true, eager: true })
    convidados: ConvidadoEventoModel[]

    @CreateDateColumn({ name: 'dt_criacao' })
    dt_criacao: Date

    @UpdateDateColumn({ name: 'dt_ult_atualizacao' })
    dt_ult_atualizacao: Date
}
