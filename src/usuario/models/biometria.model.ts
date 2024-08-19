import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm'
import { UsuarioModel } from './usuario.model'

@Entity('biometria_usuario')
export class BiometriaUsuarioModel extends BaseEntity {
    @PrimaryColumn()
    id: string

    @Column()
    foto: string

    @Column()
    cpf: string

    @OneToOne(() => UsuarioModel, (usuario) => usuario.biometria) // Relação ManyToOne com a entidade de usuário
    @JoinColumn({ name: 'cpf', referencedColumnName: 'cpf', foreignKeyConstraintName: 'cpf_usuario_fk' }) // Chave estrangeira
    usuario: UsuarioModel

    @CreateDateColumn({ name: 'dt_criacao' })
    dt_criacao: Date

    @UpdateDateColumn({ name: 'dt_ult_atualizacao' })
    dt_ult_atualizacao: Date
}
