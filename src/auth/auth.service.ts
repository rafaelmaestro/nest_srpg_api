import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { Usuario } from '../usuario/entities/usuario.entity'
import { UsuarioService } from '../usuario/usuario.service'
import { UnauthorizedError } from './errors/unauthorized.error'
import { UserPayload } from './interfaces/UserPayload'
import { UserToken } from './interfaces/UserToken'

@Injectable()
export class AuthService {
    constructor(
        private readonly usuarioService: UsuarioService,
        private readonly jwtService: JwtService,
    ) {}
    async validateUser(cpfcpOuEmail: string, senha: string) {
        let usuario = null
        if (cpfcpOuEmail.includes('@')) {
            usuario = await this.usuarioService.findByEmail(cpfcpOuEmail)
        } else {
            usuario = await this.usuarioService.findByCpf(cpfcpOuEmail)
        }

        if (usuario) {
            const isSenhaValida = await bcrypt.compare(senha, usuario.senha)

            if (isSenhaValida) {
                return {
                    ...usuario,
                    senha: undefined,
                }
            }

            const isHashRecuperacaoSenhaValido = await bcrypt.compare(senha, usuario.hash_recuperacao_senha)

            if (isHashRecuperacaoSenhaValido) {
                return {
                    ...usuario,
                    senha: undefined,
                }
            }
        }
        throw new UnauthorizedError('E-mail/CPF ou senha fornecidos estão incorretos.')
    }

    login(user: Usuario): UserToken {
        const payload: UserPayload = {
            cpf: user.cpf,
            sub: Number(user.cpf.replace(/\D/g, '')),
            email: user.email,
            nome: user.nome,
        }

        const jwtToken = this.jwtService.sign(payload)

        return {
            access_token: jwtToken,
        }
    }
}
