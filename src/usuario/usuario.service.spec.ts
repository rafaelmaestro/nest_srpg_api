import { ulid } from 'ulid'
import { setEnv } from '../../config'
import { EMailerService } from '../mailer/mailer.service'
import { mockUsuario } from './__mocks__/usuario.mock'
import { UsuarioRepository } from './usuario.repository'
import { UsuarioService } from './usuario.service'
import { UsuarioExistenteError } from './errors/usuario-existente.error'
import { NotFoundException } from '@nestjs/common'
import { mockUsuarioModel } from './models/__mocks__/usuario.model.mock'
import { UsuarioModel } from './models/usuario.model'

setEnv()

const UsuarioRepositoryMock = UsuarioRepository as unknown as jest.Mock<UsuarioRepository>
const EmailerServiceMock = EMailerService as unknown as jest.Mock<EMailerService>

const sutFactory = () => {
    const usuarioRepositoryMock = new UsuarioRepositoryMock() as jest.Mocked<UsuarioRepository>
    const emailerServiceMock = new EmailerServiceMock() as jest.Mocked<EMailerService>

    const sut = new UsuarioService(usuarioRepositoryMock, emailerServiceMock)
    return { sut, usuarioRepositoryMock }
}

describe(`${UsuarioService.name} suite`, () => {
    it(`deve estar definido`, () => {
        const { sut } = sutFactory()
        expect(sut).toBeDefined()
    })

    describe(`${UsuarioService.prototype.create.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.create).toBeDefined()
        })

        it(`deve criar um usuário com foto de biometria`, async () => {
            const { sut, usuarioRepositoryMock } = sutFactory()

            const usuario = mockUsuario.criarUsuario1()

            jest.spyOn(usuarioRepositoryMock, 'save').mockResolvedValueOnce({
                usuario: {
                    cpf: usuario.cpf,
                    email: usuario.email,
                    nome: usuario.nome,
                },
                biometria: {
                    id: ulid(),
                },
            })
            const result = await sut.create(usuario)
            expect(result.usuario).toBeDefined()
            expect(result.usuario.cpf).toBeDefined()
            expect(result.usuario.email).toBeDefined()
            expect(result.usuario.nome).toBeDefined()
            expect(result.biometria).toBeDefined()
        })

        it(`deve criar um usuário com foto de biometria padrão caso a variável de ambiente BIOMETRIA_ON_BOOLEAN seja false`, async () => {
            const { sut, usuarioRepositoryMock } = sutFactory()

            const usuario = mockUsuario.criarUsuario1()

            // Salvar o valor original da variável de ambiente
            const originalBiometriaOnBoolean = process.env.BIOMETRIA_ON_BOOLEAN

            // Definir a variável de ambiente para false
            process.env.BIOMETRIA_ON_BOOLEAN = 'false'

            jest.spyOn(usuarioRepositoryMock, 'save').mockResolvedValueOnce({
                usuario: {
                    cpf: usuario.cpf,
                    email: usuario.email,
                    nome: usuario.nome,
                },
                biometria: {
                    id: ulid(),
                },
            })

            usuario.foto = null
            const result = await sut.create(usuario)
            expect(result.usuario).toBeDefined()
            expect(result.usuario.cpf).toBeDefined()
            expect(result.usuario.email).toBeDefined()
            expect(result.usuario.nome).toBeDefined()
            expect(result.biometria).toBeDefined()

            // Restaurar o valor original da variável de ambiente
            process.env.BIOMETRIA_ON_BOOLEAN = originalBiometriaOnBoolean
        })

        it(`deve lançar uma exceção BadRequestException caso a variável de ambiente BIOMETRIA_ON_BOOLEAN seja true e a foto de biometria não seja informada`, async () => {
            const { sut } = sutFactory()

            // Salvar o valor original da variável de ambiente
            const originalBiometriaOnBoolean = process.env.BIOMETRIA_ON_BOOLEAN

            // Definir a variável de ambiente para true
            process.env.BIOMETRIA_ON_BOOLEAN = 'true'

            const usuario = mockUsuario.criarUsuario1()
            usuario.foto = ''

            try {
                await sut.create(usuario)
                fail('A exceção BadRequestException não foi lançada')
            } catch (error) {
                expect(error.message).toBe('A foto de referência para biometria é obrigatória')
            }

            // Restaurar o valor original da variável de ambiente
            process.env.BIOMETRIA_ON_BOOLEAN = originalBiometriaOnBoolean
        })

        it(`deve lançar uma exceção ${UsuarioExistenteError.name} caso o usuário já exista`, async () => {
            const { sut, usuarioRepositoryMock } = sutFactory()

            const usuario = mockUsuario.criarUsuario1()

            jest.spyOn(usuarioRepositoryMock, 'save').mockRejectedValueOnce(new UsuarioExistenteError())

            try {
                await sut.create(usuario)
                fail('A exceção UsuarioExistenteError não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(UsuarioExistenteError)
            }
        })
    })

    describe(`${UsuarioService.prototype.recuperarSenha.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.recuperarSenha).toBeDefined()
        })

        it(`deve lançar uma exceção NotFoundException caso o usuário não seja encontrado`, async () => {
            const { sut, usuarioRepositoryMock } = sutFactory()

            jest.spyOn(usuarioRepositoryMock, 'findOneByEmail').mockResolvedValueOnce(null)

            try {
                await sut.recuperarSenha('email')
                fail('A exceção NotFoundException não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(NotFoundException)
            }
        })

        it(`deve gerar um hash de recuperação de senha e enviar um e-mail com a nova senha`, async () => {
            const { sut, usuarioRepositoryMock } = sutFactory()

            const usuario = mockUsuario.criarUsuario1()

            jest.spyOn(usuarioRepositoryMock, 'findOneByEmail').mockResolvedValueOnce({
                ...mockUsuarioModel.usuarioModel1(),
                hasId: jest.fn(),
                save: jest.fn(),
                remove: jest.fn(),
                softRemove: jest.fn(),
                recover: jest.fn(),
            } as any)

            jest.spyOn(usuarioRepositoryMock, 'setHashRecuperacaoSenha').mockResolvedValueOnce(null)

            jest.spyOn(EmailerServiceMock.prototype, 'sendMail').mockResolvedValueOnce(null)

            await sut.recuperarSenha(usuario.email)
        })
    })

    describe(`${UsuarioService.prototype.findByEmail.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.findByEmail).toBeDefined()
        })

        it(`deve chamar o método findOneByEmail do repositório`, async () => {
            const { sut, usuarioRepositoryMock } = sutFactory()

            jest.spyOn(usuarioRepositoryMock, 'findOneByEmail').mockResolvedValueOnce(null)

            await sut.findByEmail('email')

            expect(usuarioRepositoryMock.findOneByEmail).toHaveBeenCalledTimes(1)
        })
    })

    describe(`${UsuarioService.prototype.findByCpf.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.findByCpf).toBeDefined()
        })

        it(`deve chamar o método findOneByCpf do repositório`, async () => {
            const { sut, usuarioRepositoryMock } = sutFactory()

            jest.spyOn(usuarioRepositoryMock, 'findOneByCpf').mockResolvedValueOnce(null)

            await sut.findByCpf('cpf')

            expect(usuarioRepositoryMock.findOneByCpf).toHaveBeenCalledTimes(1)
        })
    })

    describe(`${UsuarioService.prototype.findUserWithCreatedAt.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.findUserWithCreatedAt).toBeDefined()
        })

        it(`deve lancar uma exceção NotFoundException caso o usuário não seja encontrado`, async () => {
            const { sut, usuarioRepositoryMock } = sutFactory()

            jest.spyOn(usuarioRepositoryMock, 'findOneByCpf').mockResolvedValueOnce(null)

            try {
                await sut.findUserWithCreatedAt('cpf')
                fail('A exceção NotFoundException não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(NotFoundException)
            }
        })
    })

    it(`deve retornar um usuário com a data de criação e ultima atualizacao formatadas`, async () => {
        const { sut, usuarioRepositoryMock } = sutFactory()

        const usuarioModel = {
            ...mockUsuarioModel.usuarioModel1(),
            hasId: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            softRemove: jest.fn(),
            recover: jest.fn(),
        }

        jest.spyOn(usuarioRepositoryMock, 'findOneByCpf').mockResolvedValueOnce(usuarioModel as unknown as UsuarioModel)

        const result = await sut.findUserWithCreatedAt('cpf')

        expect(result.cpf).toBeDefined()
        expect(result.nome).toBeDefined()
        expect(result.email).toBeDefined()
        expect(result.dt_criacao).toBeDefined()
        expect(result.dt_ult_atualizacao).toBeDefined()
        expect(result.biometria).toBeDefined()
    })

    describe(`${UsuarioService.prototype.updateUsuario.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.updateUsuario).toBeDefined()
        })

        it(`deve lançar uma exceção BadRequestException caso o e-mail ou CPF não sejam informados`, async () => {
            const { sut } = sutFactory()

            try {
                await sut.updateUsuario({} as any, {} as any)
                fail('A exceção BadRequestException não foi lançada')
            } catch (error) {
                expect(error.message).toBe('O e-mail ou CPF são obrigatórios para atualização')
            }
        })

        it(`deve lançar uma exceção BadRequestException caso o e-mail informado seja diferente do e-mail do usuário que realizou a requisição`, async () => {
            const { sut } = sutFactory()

            try {
                await sut.updateUsuario({ email: 'email' } as any, { email: 'email2' } as any)
                fail('A exceção BadRequestException não foi lançada')
            } catch (error) {
                expect(error.message).toBe('Não é possível alterar informações de outro usuário')
            }
        })

        it(`deve lançar uma exceção BadRequestException caso o CPF informado seja diferente do CPF do usuário que realizou a requisição`, async () => {
            const { sut } = sutFactory()

            try {
                await sut.updateUsuario({ cpf: 'cpf' } as any, { cpf: 'cpf2' } as any)
                fail('A exceção BadRequestException não foi lançada')
            } catch (error) {
                expect(error.message).toBe('Não é possível alterar informações de outro usuário')
            }
        })

        it(`deve lançar uma exceção BadRequestException caso a senha seja informada mas a senha antiga não seja`, async () => {
            const { sut } = sutFactory()

            try {
                await sut.updateUsuario({ senha: 'senha', cpf: 'cpf1' } as any, { cpf: 'cpf1' } as any)
                fail('A exceção BadRequestException não foi lançada')
            } catch (error) {
                expect(error.message).toBe('A senha antiga é obrigatória para atualização da senha')
            }
        })

        it(`deve lançar uma exceção BadRequestException caso o novo e-mail seja igual ao e-mail atual`, async () => {
            const { sut } = sutFactory()

            try {
                await sut.updateUsuario({ email_novo: 'email', email: 'email' } as any, { email: 'email' } as any)
                fail('A exceção BadRequestException não foi lançada')
            } catch (error) {
                expect(error.message).toBe('O novo e-mail deve ser diferente do e-mail atual')
            }
        })

        it(`deve lançar uma exceção BadRequestException caso a nova senha seja igual à senha antiga`, async () => {
            const { sut } = sutFactory()

            try {
                await sut.updateUsuario(
                    { senha: 'senha', senha_antiga: 'senha', email: 'email1' } as any,
                    { email: 'email1' } as any,
                )
                fail('A exceção BadRequestException não foi lançada')
            } catch (error) {
                expect(error.message).toBe('A nova senha deve ser diferente da senha antiga')
            }
        })

        it(`deve atualizar a senha do usuário com sucesso`, async () => {
            const { sut, usuarioRepositoryMock } = sutFactory()

            const usuario = mockUsuarioModel.usuarioModel1()

            jest.spyOn(usuarioRepositoryMock, 'findOneByEmailWithBiometria').mockResolvedValueOnce(usuario as any)
            jest.spyOn(usuarioRepositoryMock, 'updateUsuario').mockResolvedValueOnce(usuario as any)

            await sut.updateUsuario(
                { senha: 'senha', senha_antiga: 'senha_antiga', email: 'email' } as any,
                { email: 'email' } as any,
            )

            expect(usuarioRepositoryMock.updateUsuario).toHaveBeenCalledTimes(1)
        })

        it(`deve atualizar o e-mail do usuário com sucesso`, async () => {
            const { sut, usuarioRepositoryMock } = sutFactory()

            const usuario = mockUsuarioModel.usuarioModel1()

            jest.spyOn(usuarioRepositoryMock, 'findOneByEmailWithBiometria').mockResolvedValueOnce(usuario as any)
            jest.spyOn(usuarioRepositoryMock, 'updateUsuario').mockResolvedValueOnce(usuario as any)

            await sut.updateUsuario({ email_novo: 'email_novo', email: 'email' } as any, { email: 'email' } as any)

            expect(usuarioRepositoryMock.updateUsuario).toHaveBeenCalledTimes(1)
        })
    })
})
