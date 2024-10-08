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
import { UsuarioController } from './usuario.controller'

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
    })

    describe(`${UsuarioController.prototype.create.name} suite`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.create).toBeDefined()
        })
    })

    describe(`${UsuarioController.prototype.recuperarSenha.name} suite`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.recuperarSenha).toBeDefined()
        })
    })

    describe(`${UsuarioController.prototype.updateUsuario.name} suite`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.updateUsuario).toBeDefined()
        })
    })

    describe(`${UsuarioController.prototype.getUsuario.name} suite`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.getUsuario).toBeDefined()
        })
    })
})
