import { ulid } from 'ulid'
import { setEnv } from '../../config'
import { mockUsuario } from './__mocks__/usuario.mock'
import { Usuario } from './entities/usuario.entity'
import { UsuarioController } from './usuario.controller'
import { UsuarioService } from './usuario.service'

setEnv()

const UsuarioServiceMock = UsuarioService as unknown as jest.Mock<UsuarioService>

const sutFactory = () => {
    const usuarioServiceMock = new UsuarioServiceMock() as jest.Mocked<UsuarioService>

    const sut = new UsuarioController(usuarioServiceMock)
    return { sut, usuarioServiceMock }
}

describe(`${UsuarioController.name} suite`, () => {
    it(`deve estar definido`, () => {
        const { sut } = sutFactory()
        expect(sut).toBeDefined()
    })

    describe(`${UsuarioController.prototype.hello.name} suite`, () => {
        it(`deve retornar uma mensagem de 'Hello, world!'`, () => {
            const { sut } = sutFactory()
            expect(sut.hello()).toEqual({
                Message: 'Hello, world!',
                Date: expect.any(Date),
            })
        })

        it(`deve executar o método hello e retornar uma mensagem de 'Hello, world!'`, () => {
            const { sut } = sutFactory()
            expect(sut.hello()).toEqual({
                Message: 'Hello, world!',
                Date: expect.any(Date),
            })
        })
    })

    describe(`${UsuarioController.prototype.create.name} suite`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.create).toBeDefined()
        })

        it(`deve executar o método create e retornar um usuário`, async () => {
            const { sut, usuarioServiceMock } = sutFactory()

            jest.spyOn(usuarioServiceMock, 'create').mockResolvedValue({
                usuario: {
                    cpf: mockUsuario.criarUsuario1().cpf,
                    nome: mockUsuario.criarUsuario1().nome,
                    email: mockUsuario.criarUsuario1().email,
                },
                biometria: {
                    id: ulid(),
                },
            })

            const usuario = await sut.create(mockUsuario.criarUsuario1())

            expect(usuario).toEqual({
                usuario: {
                    cpf: expect.any(String),
                    nome: expect.any(String),
                    email: expect.any(String),
                },
                biometria: {
                    id: expect.any(String),
                },
            })
            expect(usuarioServiceMock.create).toHaveBeenCalledWith(mockUsuario.criarUsuario1())
        })
    })

    describe(`${UsuarioController.prototype.recuperarSenha.name} suite`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.recuperarSenha).toBeDefined()
        })

        it(`deve executar o método recuperarSenha e não retornar nada`, async () => {
            const { sut, usuarioServiceMock } = sutFactory()

            jest.spyOn(usuarioServiceMock, 'recuperarSenha').mockResolvedValue()

            const recuperarSenha = await sut.recuperarSenha({
                email: mockUsuario.criarUsuario1().email,
            })

            expect(recuperarSenha).toBeUndefined()
            expect(usuarioServiceMock.recuperarSenha).toHaveBeenCalled()
        })
    })

    describe(`${UsuarioController.prototype.updateUsuario.name} suite`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.updateUsuario).toBeDefined()
        })

        it(`deve executar o método updateUsuario e retornar um usuário`, async () => {
            const { sut, usuarioServiceMock } = sutFactory()

            const dataCriacaoEAtualizacaoTeste = new Date().toISOString()

            const idBiometriaTeste = ulid()

            jest.spyOn(usuarioServiceMock, 'updateUsuario').mockResolvedValue({
                cpf: mockUsuario.criarUsuario1().cpf,
                nome: mockUsuario.criarUsuario1().nome,
                email: mockUsuario.criarUsuario1().email,
                dt_criacao: dataCriacaoEAtualizacaoTeste,
                dt_ult_atualizacao: dataCriacaoEAtualizacaoTeste,
                biometria: {
                    id: idBiometriaTeste,
                },
            })

            const usuario = await sut.updateUsuario(mockUsuario.criarUsuario1(), new Usuario())

            expect(usuario).toEqual({
                cpf: mockUsuario.criarUsuario1().cpf,
                nome: mockUsuario.criarUsuario1().nome,
                email: mockUsuario.criarUsuario1().email,
                dt_criacao: dataCriacaoEAtualizacaoTeste,
                dt_ult_atualizacao: dataCriacaoEAtualizacaoTeste,
                biometria: {
                    id: idBiometriaTeste,
                },
            })
            expect(usuarioServiceMock.updateUsuario).toHaveBeenCalled()
        })
    })

    describe(`${UsuarioController.prototype.getUsuario.name} suite`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.getUsuario).toBeDefined()
        })

        it(`deve executar o método getUsuario e retornar um usuário`, async () => {
            const { sut, usuarioServiceMock } = sutFactory()

            const dataCriacaoEAtualizacaoTeste = new Date().toISOString()

            const idBiometriaTeste = ulid()

            jest.spyOn(usuarioServiceMock, 'findUserWithCreatedAt').mockResolvedValue({
                cpf: mockUsuario.criarUsuario1().cpf,
                nome: mockUsuario.criarUsuario1().nome,
                email: mockUsuario.criarUsuario1().email,
                dt_criacao: dataCriacaoEAtualizacaoTeste,
                dt_ult_atualizacao: dataCriacaoEAtualizacaoTeste,
                biometria: {
                    id: idBiometriaTeste,
                },
            })

            const usuario = await sut.getUsuario(mockUsuario.criarUsuario1().cpf)

            expect(usuario).toEqual({
                cpf: mockUsuario.criarUsuario1().cpf,
                nome: mockUsuario.criarUsuario1().nome,
                email: mockUsuario.criarUsuario1().email,
                dt_criacao: dataCriacaoEAtualizacaoTeste,
                dt_ult_atualizacao: dataCriacaoEAtualizacaoTeste,
                biometria: {
                    id: idBiometriaTeste,
                },
            })

            expect(usuarioServiceMock.findUserWithCreatedAt).toHaveBeenCalledWith(mockUsuario.criarUsuario1().cpf)
            expect(usuarioServiceMock.findUserWithCreatedAt).toHaveBeenCalled()
        })
    })

    describe(`${UsuarioController.prototype.compareToken.name} suite`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.compareToken).toBeDefined()
        })

        it(`deve executar o método compareToken e retornar true`, async () => {
            const { sut, usuarioServiceMock } = sutFactory()

            jest.spyOn(usuarioServiceMock, 'compareToken').mockResolvedValue(true)

            const compareToken = await sut.compareToken(
                {
                    token: 'token',
                },
                mockUsuario.criarUsuario1(),
            )

            expect(compareToken).toBe(true)
            expect(usuarioServiceMock.compareToken).toHaveBeenCalledWith('token', mockUsuario.criarUsuario1())
            expect(usuarioServiceMock.compareToken).toHaveBeenCalled()
        })
    })
})
