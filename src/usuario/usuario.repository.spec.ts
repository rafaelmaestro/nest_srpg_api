import { DataSource, QueryRunner } from 'typeorm'
import { setEnv } from '../../config'
import { EMailerService } from '../mailer/mailer.service'
import { UsuarioRepository } from './usuario.repository'
import { UsuarioService } from './usuario.service'
import { UsuarioExistenteError } from './errors/usuario-existente.error'
import { mockUsuario } from './__mocks__/usuario.mock'
import { mockUsuarioModel } from './models/__mocks__/usuario.model.mock'
import { mockBiometriaModel } from './models/__mocks__/biometria.model.mock'
import { UsuarioModel } from './models/usuario.model'
import { BadRequestException, NotFoundException } from '@nestjs/common'

setEnv()

const DataSourceMock = jest.fn()

const sutFactory = () => {
    const dataSourceMock = new DataSourceMock() as jest.Mocked<DataSource>

    const sut = new UsuarioRepository(dataSourceMock)
    return { sut, dataSourceMock }
}

describe(`${UsuarioRepository.name} suite`, () => {
    it(`deve estar definido`, () => {
        const { sut } = sutFactory()
        expect(sut).toBeDefined()
    })

    describe(`${UsuarioRepository.prototype.save.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.save).toBeDefined()
        })

        it(`deve lançar um exceção ${UsuarioExistenteError.name} caso o usuário já exista, realizando rollback da transação e chamando o release do queryRunner `, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const usuario = mockUsuario.criarUsuario1()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    save: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.createQueryRunner = jest.fn().mockReturnValue(queryRunnerMock)

            jest.spyOn(UsuarioRepository.prototype, 'findOneByCpf').mockReturnValueOnce(
                Promise.resolve(mockUsuarioModel.usuarioModel1() as unknown as UsuarioModel),
            )

            try {
                await sut.save(usuario)
                fail('A exceção UsuarioExistenteError não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(UsuarioExistenteError)
                expect(dataSourceMock.createQueryRunner).toHaveBeenCalled()
                expect(queryRunnerMock.connect).toHaveBeenCalled()
                expect(queryRunnerMock.startTransaction).toHaveBeenCalled()
                expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled()
                expect(queryRunnerMock.release).toHaveBeenCalled()
            }
        })

        it(`deve lançar um exceção caso ocorra um erro ao salvar o usuário, realizando rollback da transação e chamando o release do queryRunner `, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const usuario = mockUsuario.criarUsuario1()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    save: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.createQueryRunner = jest.fn().mockReturnValue(queryRunnerMock)

            jest.spyOn(UsuarioRepository.prototype, 'findOneByCpf').mockResolvedValueOnce(null)

            queryRunnerMock.manager.save.mockRejectedValueOnce(new Error('Erro ao salvar o usuário'))

            try {
                await sut.save(usuario)
                fail('A exceção Error não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
                expect(dataSourceMock.createQueryRunner).toHaveBeenCalled()
                expect(queryRunnerMock.connect).toHaveBeenCalled()
                expect(queryRunnerMock.startTransaction).toHaveBeenCalled()
                expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled()
                expect(queryRunnerMock.release).toHaveBeenCalled()
            }
        })

        it(`deve salvar um usuário com sucesso e retorna-lo`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const usuario = mockUsuario.criarUsuario1()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    save: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.createQueryRunner = jest.fn().mockReturnValue(queryRunnerMock)

            jest.spyOn(UsuarioRepository.prototype, 'findOneByCpf').mockResolvedValueOnce(null)

            queryRunnerMock.manager.save.mockResolvedValueOnce(mockUsuarioModel.usuarioModel1())
            queryRunnerMock.manager.save.mockResolvedValueOnce(mockBiometriaModel.biometriaModel1())

            const result = await sut.save(usuario)

            const usuarioRetornado = {
                usuario: {
                    cpf: mockUsuarioModel.usuarioModel1().cpf,
                    nome: mockUsuarioModel.usuarioModel1().nome,
                    email: mockUsuarioModel.usuarioModel1().email,
                },
                biometria: {
                    id: mockBiometriaModel.biometriaModel1().id,
                },
            }

            expect(result).toEqual(usuarioRetornado)
            expect(dataSourceMock.createQueryRunner).toHaveBeenCalled()
            expect(queryRunnerMock.connect).toHaveBeenCalled()
            expect(queryRunnerMock.startTransaction).toHaveBeenCalled()
            expect(queryRunnerMock.manager.save).toHaveBeenCalled()
            expect(queryRunnerMock.commitTransaction).toHaveBeenCalled()
            expect(queryRunnerMock.release).toHaveBeenCalled()
        })
    })

    describe(`${UsuarioRepository.prototype.findOneByEmail.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.findOneByEmail).toBeDefined()
        })

        it(`deve retornar um usuário pelo e-mail`, async () => {
            const { sut } = sutFactory()

            const usuario = mockUsuarioModel.usuarioModel1()

            jest.spyOn(UsuarioModel, 'findOne').mockResolvedValueOnce(usuario as any)

            const result = await sut.findOneByEmail(usuario.email)

            expect(result).toEqual(usuario)
            expect(UsuarioModel.findOne).toHaveBeenCalled()
        })
    })

    describe(`${UsuarioRepository.prototype.findOneByCpf.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.findOneByCpf).toBeDefined()
        })

        it(`deve retornar um usuário pelo CPF`, async () => {
            const { sut } = sutFactory()

            const usuario = mockUsuarioModel.usuarioModel1()

            jest.spyOn(UsuarioModel, 'findOne').mockResolvedValueOnce(usuario as any)

            const result = await sut.findOneByCpf(usuario.cpf)

            expect(result).toEqual(usuario)
            expect(UsuarioModel.findOne).toHaveBeenCalled()
        })
    })

    describe(`${UsuarioRepository.prototype.findOneByEmailWithBiometria.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.findOneByEmailWithBiometria).toBeDefined()
        })

        it(`deve retornar um usuário pelo e-mail com a biometria`, async () => {
            const { sut } = sutFactory()

            const usuario = mockUsuarioModel.usuarioModel1()

            jest.spyOn(UsuarioModel, 'findOne').mockResolvedValueOnce(usuario as any)

            const result = await sut.findOneByEmailWithBiometria(usuario.email)

            expect(result).toEqual(usuario)
            expect(UsuarioModel.findOne).toHaveBeenCalled()
        })
    })

    describe(`${UsuarioRepository.prototype.findOneByCpfWithBiometria.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.findOneByCpfWithBiometria).toBeDefined()
        })

        it(`deve retornar um usuário pelo CPF com a biometria`, async () => {
            const { sut } = sutFactory()

            const usuario = mockUsuarioModel.usuarioModel1()

            jest.spyOn(UsuarioModel, 'findOne').mockResolvedValueOnce(usuario as any)

            const result = await sut.findOneByCpfWithBiometria(usuario.cpf)

            expect(result).toEqual(usuario)
            expect(UsuarioModel.findOne).toHaveBeenCalled()
        })
    })

    describe(`${UsuarioRepository.prototype.setHashRecuperacaoSenha.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.setHashRecuperacaoSenha).toBeDefined()
        })

        it(`deve setar o hash de recuperação de senha do usuário`, async () => {
            const { sut } = sutFactory()

            const usuarioModel = {
                ...mockUsuarioModel.usuarioModel1(),
                save: jest.fn(),
                findOne: jest.fn(),
            }

            jest.spyOn(UsuarioModel, 'findOne').mockResolvedValueOnce(usuarioModel as unknown as UsuarioModel)

            await sut.setHashRecuperacaoSenha(usuarioModel.hash_recuperacao_senha, 'hash')

            expect(UsuarioModel.findOne).toHaveBeenCalled()
            expect(usuarioModel.hash_recuperacao_senha).toBe('hash')
            expect(usuarioModel.save).toHaveBeenCalled()
        })

        it(`não deve setar o hash de recuperação de senha do usuário caso ele não exista`, async () => {
            const { sut } = sutFactory()

            jest.spyOn(UsuarioModel, 'findOne').mockResolvedValueOnce(null)

            await sut.setHashRecuperacaoSenha('email', 'hash')

            expect(UsuarioModel.findOne).toHaveBeenCalled()
        })
    })

    describe(`${UsuarioRepository.prototype.updateUsuario.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.updateUsuario).toBeDefined()
        })

        it(`deve lançar um NotFoundException caso o usuário não seja encontrado buscando com cpf`, async () => {
            const { sut } = sutFactory()

            jest.spyOn(UsuarioRepository.prototype, 'findOneByCpfWithBiometria').mockResolvedValueOnce(null)

            try {
                await sut.updateUsuario({ cpf: '123456789' })
                fail('A exceção NotFoundException não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(NotFoundException)
                expect(error.message).toBe('Usuário não encontrado')
                expect(UsuarioRepository.prototype.findOneByCpfWithBiometria).toHaveBeenCalled()
            }
        })

        it(`deve lançar um NotFoundException caso o usuário não seja encontrado buscando com email`, async () => {
            const { sut } = sutFactory()

            jest.spyOn(UsuarioRepository.prototype, 'findOneByEmailWithBiometria').mockResolvedValueOnce(null)

            try {
                await sut.updateUsuario({ email: 'email1' })
                fail('A exceção NotFoundException não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(NotFoundException)
                expect(error.message).toBe('Usuário não encontrado')
                expect(UsuarioRepository.prototype.findOneByEmailWithBiometria).toHaveBeenCalled()
            }
        })

        it(`deve lançar uma BadRequestException caso a senha antiga informada seja inválida e também não corresponda ao hash de recuperação de senha do usuário`, async () => {
            const { sut } = sutFactory()

            const usuario = mockUsuarioModel.usuarioModel1()

            jest.spyOn(UsuarioRepository.prototype, 'findOneByCpfWithBiometria').mockResolvedValueOnce(usuario as any)

            try {
                await sut.updateUsuario({ cpf: '123456789', senha: 'senha', senha_antiga: 'senha' })
                fail('A exceção BadRequestException não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException)
                expect(error.message).toBe('Senha antiga inválida')
                expect(UsuarioRepository.prototype.findOneByCpfWithBiometria).toHaveBeenCalled()
            }
        })

        it(`deve lançar uma BadRequestException caso a senha antiga informada seja inválida e o usuário não possua hash de recuperação de senha`, async () => {
            const { sut } = sutFactory()

            const usuario = mockUsuarioModel.usuarioModel1()
            usuario.hash_recuperacao_senha = null

            jest.spyOn(UsuarioRepository.prototype, 'findOneByCpfWithBiometria').mockResolvedValueOnce(usuario as any)

            try {
                await sut.updateUsuario({ cpf: '123456789', senha: 'senha', senha_antiga: 'senha' })
                fail('A exceção BadRequestException não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException)
                expect(error.message).toBe('Senha antiga inválida')
                expect(UsuarioRepository.prototype.findOneByCpfWithBiometria).toHaveBeenCalled()
            }
        })

        it(`deve lançar uma BadRequestException caso a nova senha seja igual a senha antiga`, async () => {
            const { sut } = sutFactory()

            const usuario = mockUsuarioModel.usuarioModel1()

            jest.spyOn(UsuarioRepository.prototype, 'findOneByCpfWithBiometria').mockResolvedValueOnce(usuario as any)

            try {
                await sut.updateUsuario({ cpf: '123456789', senha: 'Abc@1234', senha_antiga: 'Abc@1234' })
                fail('A exceção BadRequestException não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException)
                expect(error.message).toBe('A nova senha deve ser diferente da senha antiga')
                expect(UsuarioRepository.prototype.findOneByCpfWithBiometria).toHaveBeenCalled()
            }
        })

        it(`deve alterar a senha do usuário com sucesso`, async () => {
            const { sut } = sutFactory()

            const usuarioModel = {
                ...mockUsuarioModel.usuarioModel1(),
                save: jest.fn(() => {
                    return usuarioModel
                }),
                findOne: jest.fn(),
            }

            const senhaAntiga = usuarioModel.senha

            jest.spyOn(UsuarioRepository.prototype, 'findOneByCpfWithBiometria').mockResolvedValueOnce(usuarioModel)

            await sut.updateUsuario({ cpf: '123456789', senha: 'Abc@12345', senha_antiga: 'Abc@1234' })

            expect(UsuarioRepository.prototype.findOneByCpfWithBiometria).toHaveBeenCalled()
            expect(usuarioModel.senha).not.toBe(senhaAntiga)
            expect(usuarioModel.save).toHaveBeenCalled()
        })

        it(`deve alterar o e-mail do usuário com sucesso`, async () => {
            const { sut } = sutFactory()

            const usuarioModel = {
                ...mockUsuarioModel.usuarioModel1(),
                save: jest.fn(() => {
                    return usuarioModel
                }),
                findOne: jest.fn(),
            }

            jest.spyOn(UsuarioRepository.prototype, 'findOneByCpfWithBiometria').mockResolvedValueOnce(usuarioModel)

            await sut.updateUsuario({ cpf: '123456789', email_novo: 'email_novo' })

            expect(UsuarioRepository.prototype.findOneByCpfWithBiometria).toHaveBeenCalled()
            expect(usuarioModel.email).toBe('email_novo')
            expect(usuarioModel.save).toHaveBeenCalled()
        })

        it(`deve alterar a foto do usuário com sucesso`, async () => {
            const { sut } = sutFactory()

            const usuarioModel = {
                ...mockUsuarioModel.usuarioModel1(),
                save: jest.fn(() => {
                    return usuarioModel
                }),
                findOne: jest.fn(),
            }

            jest.spyOn(UsuarioRepository.prototype, 'findOneByCpfWithBiometria').mockResolvedValueOnce(usuarioModel)

            await sut.updateUsuario({ cpf: '123456789', foto: 'foto' })

            expect(UsuarioRepository.prototype.findOneByCpfWithBiometria).toHaveBeenCalled()
            expect(usuarioModel.biometria.foto).toBe('foto')
            expect(usuarioModel.save).toHaveBeenCalled()
        })
    })
})
