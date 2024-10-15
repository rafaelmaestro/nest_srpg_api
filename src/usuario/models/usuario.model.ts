import { BaseEntity, Column, CreateDateColumn, Entity, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { BiometriaUsuarioModel } from './biometria.model'

@Entity('usuario')
export class UsuarioModel extends BaseEntity {
    @PrimaryColumn()
    cpf: string

    @Column()
    nome: string

    @Column()
    email: string

    @Column()
    hash_recuperacao_senha: string

    @Column()
    senha: string

    @Column()
    token_email: string

    @OneToOne(() => BiometriaUsuarioModel, (biometria) => biometria.usuario)
    biometria: BiometriaUsuarioModel

    @CreateDateColumn({ name: 'dt_criacao' })
    dt_criacao: Date

    @UpdateDateColumn({ name: 'dt_ult_atualizacao' })
    dt_ult_atualizacao: Date
}
