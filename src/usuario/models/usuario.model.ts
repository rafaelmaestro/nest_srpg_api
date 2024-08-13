import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('usuario')
export class UsuarioModel extends BaseEntity {
    @PrimaryColumn()
    cpf: string

    @Column()
    nome: string

    @Column()
    email: string

    @Column()
    senha: string

    @CreateDateColumn({ name: 'data_criacao' })
    dataCriacao: Date

    @UpdateDateColumn({ name: 'data_atualizacao' })
    dataAtualizacao: Date
}
