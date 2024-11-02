import { BadRequestException, NotFoundException } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { ulid } from 'ulid'
import { setEnv } from '../../config'
import { mockUsuarioModel } from '../usuario/models/__mocks__/usuario.model.mock'
import { UsuarioModel } from '../usuario/models/usuario.model'
import { UsuarioRepository } from '../usuario/usuario.repository'
import { mockEvento } from './__mocks__/evento.mock'
import { UpdateEventoDto } from './dto/update-evento.dto'
import { Convidado } from './entities/convidado.entity'
import { StatusEvento } from './entities/evento.entity'
import { EventoRepository } from './evento.repository'
import { mockConvidadoModel } from './models/__mocks__/convidado-evento.model'
import { mockEventoModel } from './models/__mocks__/evento.model.mock'
import { CheckInsModel } from './models/check-ins.model'

setEnv()

const DataSourceMock = jest.fn()
const UsuarioRepositoryMock = UsuarioRepository as unknown as jest.Mock<UsuarioRepository>

const sutFactory = () => {
    const dataSourceMock = new DataSourceMock() as jest.Mocked<DataSource>
    const usuarioRepositoryMock = new UsuarioRepositoryMock() as jest.Mocked<UsuarioRepository>

    const sut = new EventoRepository(dataSourceMock, usuarioRepositoryMock)
    return { sut, dataSourceMock, usuarioRepositoryMock }
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

        it(`deve lançar realizar rollback da transação e chamando o release do queryRunner caso ocorra algum erro `, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const usuario = mockEvento.criarEvento1()

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

            queryRunnerMock.manager.save.mockRejectedValue(new Error('Erro'))

            try {
                await sut.save(usuario)
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
                expect(dataSourceMock.createQueryRunner).toHaveBeenCalled()
                expect(queryRunnerMock.connect).toHaveBeenCalled()
                expect(queryRunnerMock.startTransaction).toHaveBeenCalled()
                expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled()
                expect(queryRunnerMock.release).toHaveBeenCalled()
            }
        })

        it(`deve realizar o save, commitar transação e retornar o evento criado`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const usuario = mockEvento.criarEvento1()

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

            queryRunnerMock.manager.save.mockResolvedValue(mockEventoModel.criarEvento1())

            const result = await sut.save(usuario)

            expect(result).toEqual({
                evento: {
                    id: mockEventoModel.criarEvento1().id,
                    nome: mockEventoModel.criarEvento1().nome,
                    status: mockEventoModel.criarEvento1().status,
                    descricao: mockEventoModel.criarEvento1().descricao,
                    distancia_maxima_permitida: mockEventoModel.criarEvento1().distancia_maxima_permitida,
                    minutos_tolerancia: mockEventoModel.criarEvento1().minutos_tolerancia,
                    dt_inicio_prevista: expect.any(Date),
                    dt_fim_prevista: expect.any(Date),
                    local: mockEventoModel.criarEvento1().local,
                    latitude: mockEventoModel.criarEvento1().latitude,
                    longitude: mockEventoModel.criarEvento1().longitude,
                    cpf_organizador: mockEventoModel.criarEvento1().cpf_organizador,
                    dt_criacao: expect.any(Date),
                    dt_ult_atualizacao: expect.any(Date),
                    check_ins: {
                        total: 0,
                        emails: [],
                    },
                    check_outs: {
                        total: 0,
                        emails: [],
                    },
                    convidados: {
                        total: mockEventoModel.criarEvento1().convidados.length,
                        emails: mockEventoModel.criarEvento1().convidados.map((convidado) => convidado.email),
                    },
                },
            })
            expect(dataSourceMock.createQueryRunner).toHaveBeenCalled()
            expect(queryRunnerMock.connect).toHaveBeenCalled()
            expect(queryRunnerMock.startTransaction).toHaveBeenCalled()
            expect(queryRunnerMock.manager.save).toHaveBeenCalled()
            expect(queryRunnerMock.commitTransaction).toHaveBeenCalled()
            expect(queryRunnerMock.release).toHaveBeenCalled()
        })
    })

    describe(`${EventoRepository.prototype.findById.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.findById).toBeDefined()
        })

        it(`deve lançar uma exceção NotFoundException caso o evento não seja encontrado`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(undefined as any),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            queryRunnerMock.manager.findOne.mockResolvedValue(undefined)

            try {
                await sut.findById('id')
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
                expect(error.message).toBe('Evento não encontrado com o ID informado: id')
            }
        })

        it(`deve retornar o evento encontrado com latitude e longitude null, check_ins e check_outs iguais à zero caso não retornem na model`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            const mockEventoModelAlterada = mockEventoModel.criarEvento1()

            mockEventoModelAlterada.latitude = null
            mockEventoModelAlterada.longitude = null
            mockEventoModelAlterada.convidados[0].check_ins = undefined
            mockEventoModelAlterada.convidados[1].check_ins = undefined

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(mockEventoModelAlterada),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            const result = await sut.findById('id')

            expect(result).toStrictEqual({
                evento: {
                    nome: 'Evento 1',
                    descricao: 'Descrição do evento 1',
                    dt_inicio_prevista: mockEventoModelAlterada.dt_inicio_prevista,
                    dt_fim_prevista: mockEventoModelAlterada.dt_fim_prevista,
                    minutos_tolerancia: 10,
                    id: '01J9SQF9YP9RYVMB61RCAS2BS1',
                    distancia_maxima_permitida: 100,
                    cpf_organizador: '123456789',
                    local: 'Local do evento 1',
                    convidados: { total: 2, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                    latitude: null,
                    longitude: null,
                    status: 'PENDENTE',
                    dt_criacao: mockEventoModel.criarEvento1().dt_criacao,
                    dt_ult_atualizacao: mockEventoModel.criarEvento1().dt_ult_atualizacao,
                    dt_inicio: null,
                    dt_fim: null,
                    check_ins: { total: 0, emails: [] },
                    check_outs: { total: 0, emails: [] },
                },
            })
        })

        it(`deve retornar o evento encontrado`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(mockEventoModel.criarEvento1()),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            queryRunnerMock.manager.findOne.mockResolvedValue(mockEventoModel.criarEvento1())

            const result = await sut.findById('id')

            expect(result).toStrictEqual({
                evento: {
                    nome: 'Evento 1',
                    descricao: 'Descrição do evento 1',
                    dt_inicio_prevista: mockEventoModel.criarEvento1().dt_inicio_prevista,
                    dt_fim_prevista: mockEventoModel.criarEvento1().dt_fim_prevista,
                    minutos_tolerancia: 10,
                    id: '01J9SQF9YP9RYVMB61RCAS2BS1',
                    distancia_maxima_permitida: 100,
                    cpf_organizador: '123456789',
                    local: 'Local do evento 1',
                    convidados: { total: 2, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                    latitude: 11111112,
                    longitude: 2222222,
                    status: 'PENDENTE',
                    dt_criacao: mockEventoModel.criarEvento1().dt_criacao,
                    dt_ult_atualizacao: mockEventoModel.criarEvento1().dt_ult_atualizacao,
                    dt_inicio: null,
                    dt_fim: null,
                    check_ins: { total: 2, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                    check_outs: { total: 1, emails: ['convidado1@email.com'] },
                },
            })
        })
    })

    describe(`${EventoRepository.prototype.remove.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.remove).toBeDefined()
        })

        it(`deve lançar uma exceção NotFoundException caso o evento não seja encontrado`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                    remove: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(undefined as any),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            queryRunnerMock.manager.findOne.mockResolvedValue(undefined)

            try {
                await sut.remove('id')
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
                expect(error.message).toBe('Evento não encontrado com o ID informado: id')
            }
        })

        it(`deve realizar a exclusão do evento`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                    remove: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
                delete: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)

            jest.spyOn(sut, 'findById').mockResolvedValue({
                evento: {
                    nome: 'Evento 1',
                    descricao: 'Descrição do evento 1',
                    dt_inicio_prevista: mockEventoModel.criarEvento1().dt_inicio_prevista,
                    dt_fim_prevista: mockEventoModel.criarEvento1().dt_fim_prevista,
                    minutos_tolerancia: 10,
                    id: '01J9SQF9YP9RYVMB61RCAS2BS1',
                    distancia_maxima_permitida: 100,
                    cpf_organizador: '123456789',
                    local: 'Local do evento 1',
                    convidados: { total: 2, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                    latitude: '11111112',
                    longitude: '2222222',
                    status: StatusEvento.PENDENTE,
                    dt_criacao: mockEventoModel.criarEvento1().dt_criacao,
                    dt_ult_atualizacao: mockEventoModel.criarEvento1().dt_ult_atualizacao,
                    dt_inicio: null,
                    dt_fim: null,
                    check_ins: { total: 2, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                    check_outs: { total: 1, emails: ['convidado1@email.com'] },
                },
            })

            queryRunnerMock.manager.findOne.mockResolvedValue(mockEventoModel.criarEvento1())

            await sut.remove('id')

            expect(queryRunnerMock.delete).toHaveBeenCalled()
        })
    })

    describe(`${EventoRepository.prototype.getRegistrosCheckIn.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.getRegistrosCheckIn).toBeDefined()
        })

        it(`deve lançar uma exceção NotFoundException caso não seja encontrado um convidado para o evento`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(undefined as any),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            queryRunnerMock.manager.findOne.mockResolvedValue(undefined)

            try {
                await sut.getRegistrosCheckIn('id', 'email')
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
                expect(error.message).toBe('Convidado não encontrado nesse evento')
            }
        })

        it(`deve retornar os registros de check-in do convidado`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            const mockConvidadoModelAlterada = mockConvidadoModel.criarConvidado1()

            mockConvidadoModelAlterada.check_ins.push({
                id: '01J9SQF9YP9RYVMB61RCAS2BS1',
                dt_hora_check_in: new Date('2024-10-10T01:48:02.000Z'),
                dt_hora_check_out: null,
            } as CheckInsModel)

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(mockConvidadoModelAlterada),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            const result = await sut.getRegistrosCheckIn('id', 'email')

            expect(result).toStrictEqual({
                registros: [
                    {
                        id: mockConvidadoModelAlterada.check_ins[0].id,
                        dt_hora_check_in: mockConvidadoModelAlterada.check_ins[0].dt_hora_check_in,
                        dt_hora_check_out: mockConvidadoModelAlterada.check_ins[0].dt_hora_check_out,
                    },
                    {
                        id: mockConvidadoModelAlterada.check_ins[1].id,
                        dt_hora_check_in: mockConvidadoModelAlterada.check_ins[1].dt_hora_check_in,
                        dt_hora_check_out: mockConvidadoModelAlterada.check_ins[1].dt_hora_check_out,
                    },
                ],
            })
        })
    })

    describe(`${EventoRepository.prototype.getListaConvidadosByNomeEvento.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.getListaConvidadosByNomeEvento).toBeDefined()
        })

        it(`deve lançar uma exceção NotFoundException caso não seja encontrado um evento com o nome informado`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                find: jest.fn().mockResolvedValue(undefined as any),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            try {
                await sut.getListaConvidadosByNomeEvento('nome')
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
                expect(error.message).toBe('Evento não encontrado')
            }
        })

        it(`deve retornar o evento com nome null, total de convidados igual a zero e emails vazios caso não seja encontrado na model`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            const mockEventoModelAlterado = mockEventoModel.criarEvento1()

            mockEventoModelAlterado.nome = null
            mockEventoModelAlterado.convidados = undefined

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                find: jest.fn().mockResolvedValue([mockEventoModelAlterado]),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            const result = await sut.getListaConvidadosByNomeEvento('nome')

            expect(result.nome).toStrictEqual(null)
            expect(result.convidados.total).toStrictEqual(0)
            expect(result.convidados.emails).toStrictEqual([])
        })

        it(`deve retornar o evento com os convidados`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                find: jest.fn().mockResolvedValue([mockEventoModel.criarEvento1()]),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            const result = await sut.getListaConvidadosByNomeEvento('nome')

            expect(result.nome).toStrictEqual('Evento 1')
            expect(result.convidados.total).toStrictEqual(2)
            expect(result.convidados.emails).toStrictEqual([
                mockEventoModel.criarEvento1().convidados[0].email,
                mockEventoModel.criarEvento1().convidados[1].email,
            ])
        })
    })

    describe(`${EventoRepository.prototype.checkIn.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.checkIn).toBeDefined()
        })

        it(`deve lançar uma exceção NotFoundException caso não seja encontrado um convidado para o evento`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(undefined as any),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            try {
                await sut.checkIn('id', {
                    email_convidado: mockConvidadoModel.criarConvidado1().email,
                    id_evento: mockConvidadoModel.criarConvidado1().id_evento,
                    check_ins: [],
                } as unknown as Convidado)
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(NotFoundException)
                expect(error.message).toBe('Convidado não encontrado nesse evento para realizar o check-in')
            }
        })

        it(`deve lançar uma exceção BadRequestException caso o convidado já tenha feito check-in`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            const mockConvidadoModelAlterado = mockConvidadoModel.criarConvidado1()

            mockConvidadoModelAlterado.check_ins.push({
                id: '01J9SQF9YP9RYVMB61RCAS2BS1',
                dt_hora_check_in: new Date('2024-10-10T01:48:02.000Z'),
                dt_hora_check_out: null,
            } as CheckInsModel)

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(mockConvidadoModelAlterado),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            try {
                await sut.checkIn('id', {
                    email_convidado: mockConvidadoModel.criarConvidado1().email,
                    id_evento: mockConvidadoModel.criarConvidado1().id_evento,
                    check_ins: mockConvidadoModelAlterado.check_ins,
                } as unknown as Convidado)
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException)
                expect(error.message).toBe('Check-in já realizado para esse convidado')
            }
        })

        it(`deve realizar realizar o check-in utilizando como base a data atual`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(mockConvidadoModel.criarConvidado1()),
                update: jest.fn().mockResolvedValue({}),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            const result = await sut.checkIn('id', {
                email_convidado: mockConvidadoModel.criarConvidado1().email,
                id_evento: mockConvidadoModel.criarConvidado1().id_evento,
                check_ins: mockConvidadoModel.criarConvidado1().check_ins,
            } as unknown as Convidado)

            expect(repositoryMock.update).toHaveBeenCalled()
            expect(result).toStrictEqual({
                registros: [
                    ...mockConvidadoModel.criarConvidado1().check_ins,
                    {
                        id: expect.any(String),
                        dt_hora_check_in: expect.any(Date),
                        dt_hora_check_out: null,
                    },
                ],
            })
        })

        it(`deve realizar realizar o check-in utilizando a data informada`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(mockConvidadoModel.criarConvidado1()),
                update: jest.fn().mockResolvedValue({}),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            const dataCheckIn = new Date('2024-10-10T01:48:02.000Z')

            const result = await sut.checkIn(
                'id',
                {
                    email_convidado: mockConvidadoModel.criarConvidado1().email,
                    id_evento: mockConvidadoModel.criarConvidado1().id_evento,
                    check_ins: mockConvidadoModel.criarConvidado1().check_ins,
                } as unknown as Convidado,
                dataCheckIn,
            )

            expect(repositoryMock.update).toHaveBeenCalled()
            expect(result).toStrictEqual({
                registros: [
                    ...mockConvidadoModel.criarConvidado1().check_ins,
                    {
                        id: expect.any(String),
                        dt_hora_check_in: dataCheckIn,
                        dt_hora_check_out: null,
                    },
                ],
            })
        })

        it(`deve realizar realizar o check-in utilizando a porcentagem de presença informada mas lançar uma exceção NotFound caso não encontre o evento`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(mockConvidadoModel.criarConvidado1()),
                update: jest.fn().mockResolvedValue({}),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            jest.spyOn(sut, 'findById').mockResolvedValue(undefined)

            const dataCheckIn = new Date('2024-10-10T01:48:02.000Z')

            try {
                await sut.checkIn(
                    'id',
                    {
                        email_convidado: mockConvidadoModel.criarConvidado1().email,
                        id_evento: mockConvidadoModel.criarConvidado1().id_evento,
                        check_ins: mockConvidadoModel.criarConvidado1().check_ins,
                    } as unknown as Convidado,
                    dataCheckIn,
                    0.5,
                )
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(NotFoundException)
                expect(error.message).toBe('Evento não encontrado, ou não está finalizado')
            }
        })

        it(`deve realizar realizar o check-in utilizando a porcentagem de presença informada mas lançar uma exceção NotFound caso o evento não esteja finalizado`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(mockConvidadoModel.criarConvidado1()),
                update: jest.fn().mockResolvedValue({}),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            jest.spyOn(sut, 'findById').mockResolvedValue({
                evento: {
                    nome: 'Evento 1',
                    descricao: 'Descrição do evento 1',
                    dt_inicio_prevista: mockEventoModel.criarEvento1().dt_inicio_prevista,
                    dt_fim_prevista: mockEventoModel.criarEvento1().dt_fim_prevista,
                    minutos_tolerancia: 10,
                    id: '01J9SQF9YP9RYVMB61RCAS2BS1',
                    distancia_maxima_permitida: 100,
                    cpf_organizador: '123456789',
                    local: 'Local do evento 1',
                    convidados: { total: 2, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                    latitude: '11111112',
                    longitude: '2222222',
                    status: StatusEvento.EM_ANDAMENTO,
                    dt_criacao: mockEventoModel.criarEvento1().dt_criacao,
                    dt_ult_atualizacao: mockEventoModel.criarEvento1().dt_ult_atualizacao,
                    dt_inicio: null,
                    dt_fim: null,
                    check_ins: { total: 2, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                    check_outs: { total: 1, emails: ['convidado1@email.com'] },
                },
            })

            const dataCheckIn = new Date('2024-10-10T01:48:02.000Z')

            try {
                await sut.checkIn(
                    'id',
                    {
                        email_convidado: mockConvidadoModel.criarConvidado1().email,
                        id_evento: mockConvidadoModel.criarConvidado1().id_evento,
                        check_ins: mockConvidadoModel.criarConvidado1().check_ins,
                    } as unknown as Convidado,
                    dataCheckIn,
                    0.5,
                )
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(NotFoundException)
                expect(error.message).toBe('Evento não encontrado, ou não está finalizado')
            }
        })

        it(`deve realizar realizar o check-in utilizando a porcentagem de presença informada`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(mockConvidadoModel.criarConvidado1()),
                update: jest.fn().mockResolvedValue({}),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            const dataCheckIn = new Date('2024-10-10T01:48:02.000Z')

            jest.spyOn(sut, 'findById').mockResolvedValue({
                evento: {
                    nome: 'Evento 1',
                    descricao: 'Descrição do evento 1',
                    dt_inicio_prevista: mockEventoModel.criarEvento1().dt_inicio_prevista,
                    dt_fim_prevista: mockEventoModel.criarEvento1().dt_fim_prevista,
                    minutos_tolerancia: 10,
                    id: '01J9SQF9YP9RYVMB61RCAS2BS1',
                    distancia_maxima_permitida: 100,
                    cpf_organizador: '123456789',
                    local: 'Local do evento 1',
                    convidados: { total: 2, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                    latitude: '11111112',
                    longitude: '2222222',
                    status: StatusEvento.FINALIZADO,
                    dt_criacao: mockEventoModel.criarEvento1().dt_criacao,
                    dt_ult_atualizacao: mockEventoModel.criarEvento1().dt_ult_atualizacao,
                    dt_inicio: new Date('2024-10-10T01:48:02.000Z'),
                    dt_fim: new Date('2024-10-10T02:48:02.000Z'),
                    check_ins: { total: 2, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                    check_outs: { total: 1, emails: ['convidado1@email.com'] },
                },
            })

            const result = await sut.checkIn(
                'id',
                {
                    email_convidado: mockConvidadoModel.criarConvidado1().email,
                    id_evento: mockConvidadoModel.criarConvidado1().id_evento,
                    check_ins: mockConvidadoModel.criarConvidado1().check_ins,
                } as unknown as Convidado,
                dataCheckIn,
                0.5,
            )

            expect(repositoryMock.update).toHaveBeenCalled()
            expect(result).toStrictEqual({
                registros: [
                    ...mockConvidadoModel.criarConvidado1().check_ins,
                    {
                        id: expect.any(String),
                        dt_hora_check_in: dataCheckIn,
                        dt_hora_check_out: new Date('2024-10-10T02:18:02.000Z'), // valor fixo, se alterar a porcentagem de presença, alterar o valor
                    },
                ],
            })
        })
    })

    describe(`${EventoRepository.prototype.checkOut.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.checkOut).toBeDefined()
        })

        it(`deve lançar uma exceção NotFoundException caso não seja encontrado o convidado no evento`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(undefined as any),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            try {
                await sut.checkOut('id', {
                    email_convidado: mockConvidadoModel.criarConvidado1().email,
                    id_evento: mockConvidadoModel.criarConvidado1().id_evento,
                    check_ins: [],
                } as unknown as Convidado)
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(NotFoundException)
                expect(error.message).toBe('Convidado não encontrado nesse evento para realizar o check-out')
            }
        })

        it(`deve lançar uma exceção BadRequestException caso o convidado não tenha registros no array de check-ins`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            const mockConvidadoModelAlterado = mockConvidadoModel.criarConvidado1()

            mockConvidadoModelAlterado.check_ins = []

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(mockConvidadoModelAlterado),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            try {
                await sut.checkOut('id', {
                    email_convidado: mockConvidadoModel.criarConvidado1().email,
                    id_evento: mockConvidadoModel.criarConvidado1().id_evento,
                    check_ins: [],
                } as unknown as Convidado)
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException)
                expect(error.message).toBe('Check-in não realizado para esse convidado')
            }
        })

        it(`deve lançar uma exceção BadRequestException caso não haja check-out a ser feito, ou seja, todos os registros existentes já foram finalizados`, async () => {
            // deve haver pelo menos um objeto com data de check=in preenchido para poder realizar o check-out, esse caso é diferente de validar se o array é vazio
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(mockConvidadoModel.criarConvidado1()),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            try {
                await sut.checkOut('id', {
                    email_convidado: mockConvidadoModel.criarConvidado1().email,
                    id_evento: mockConvidadoModel.criarConvidado1().id_evento,
                    check_ins: [],
                } as unknown as Convidado)
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException)
                expect(error.message).toBe('Check-out já realizado para esse convidado')
            }
        })

        it(`deve realizar realizar o check-out utilizando como base a data atual`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            const mockConvidadoModelAlterado = mockConvidadoModel.criarConvidado1()

            mockConvidadoModelAlterado.check_ins.push({
                id: ulid(),
                dt_hora_check_in: new Date('2024-10-10T01:48:02.000Z'),
                dt_hora_check_out: null,
            } as CheckInsModel)

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(mockConvidadoModelAlterado),
                update: jest.fn().mockResolvedValue({}),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            const result = await sut.checkOut('id', {
                email_convidado: mockConvidadoModel.criarConvidado1().email,
                id_evento: mockConvidadoModel.criarConvidado1().id_evento,
                check_ins: mockConvidadoModel.criarConvidado1().check_ins,
            } as unknown as Convidado)

            expect(repositoryMock.update).toHaveBeenCalled()
            expect(result).toStrictEqual({
                registros: [
                    ...mockConvidadoModel.criarConvidado1().check_ins,
                    {
                        id: expect.any(String),
                        dt_hora_check_in: expect.any(Date),
                        dt_hora_check_out: expect.any(Date),
                    },
                ],
            })
            expect(result.registros[1].dt_hora_check_out).not.toBeNull()
        })

        it(`deve realizar realizar o check-out utilizando a data informada`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            const mockConvidadoModelAlterado = mockConvidadoModel.criarConvidado1()

            mockConvidadoModelAlterado.check_ins.push({
                id: ulid(),
                dt_hora_check_in: new Date('2024-10-10T01:48:02.000Z'),
                dt_hora_check_out: null,
            } as CheckInsModel)

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(mockConvidadoModelAlterado),
                update: jest.fn().mockResolvedValue({}),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            const result = await sut.checkOut(
                'id',
                {
                    email_convidado: mockConvidadoModel.criarConvidado1().email,
                    id_evento: mockConvidadoModel.criarConvidado1().id_evento,
                    check_ins: mockConvidadoModel.criarConvidado1().check_ins,
                } as unknown as Convidado,
                new Date('2024-10-10T01:48:02.000Z'),
            )

            expect(repositoryMock.update).toHaveBeenCalled()
            expect(result).toStrictEqual({
                registros: [
                    ...mockConvidadoModel.criarConvidado1().check_ins,
                    {
                        id: expect.any(String),
                        dt_hora_check_in: expect.any(Date),
                        dt_hora_check_out: expect.any(Date),
                    },
                ],
            })
            expect(result.registros[1].dt_hora_check_out).toStrictEqual(new Date('2024-10-10T01:48:02.000Z'))
        })

        it(`deve tratar o retorno da data de check-out caso retorne null por qualquer motivo, setando à força o valor null no objeto`, async () => {
            const { sut, dataSourceMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    findOne: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            const mockConvidadoModelAlterado = mockConvidadoModel.criarConvidado1()

            mockConvidadoModelAlterado.check_ins.push({
                id: '01J9SQF9YP9RYVMB61RCAS2BS1',
                dt_hora_check_in: new Date('2024-10-10T01:48:02.000Z'),
                dt_hora_check_out: null,
            } as CheckInsModel)

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            const repositoryMock = {
                findOne: jest.fn().mockResolvedValue(mockConvidadoModelAlterado),
                update: jest.fn().mockResolvedValue({}),
            }
            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            const result = await sut.checkOut('id', {
                email_convidado: mockConvidadoModel.criarConvidado1().email,
                id_evento: mockConvidadoModel.criarConvidado1().id_evento,
                check_ins: mockConvidadoModel.criarConvidado1().check_ins,
            } as unknown as Convidado)

            expect(repositoryMock.update).toHaveBeenCalled()
            expect(result.registros[1]).toStrictEqual({
                id: expect.any(String),
                dt_hora_check_in: expect.any(Date),
                dt_hora_check_out: null,
            })
        })
    })

    describe(`${EventoRepository.prototype.find.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.find).toBeDefined()
        })

        it(`deve realizar a busca incluindo nos filtros todas as opções disponíveis`, async () => {
            const { sut, dataSourceMock, usuarioRepositoryMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    find: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)

            const repositoryMock = {
                update: jest.fn().mockResolvedValue({}),
                createQueryBuilder: jest.fn().mockReturnValue({
                    leftJoinAndSelect: jest.fn().mockReturnThis(),
                    leftJoin: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    orWhere: jest.fn().mockReturnThis(),
                    skip: jest.fn().mockReturnThis(),
                    take: jest.fn().mockReturnThis(),
                    addOrderBy: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([]),
                    getCount: jest.fn().mockResolvedValue(0),
                }),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            jest.spyOn(usuarioRepositoryMock, 'findOneByCpf').mockResolvedValue(
                mockUsuarioModel.usuarioModel1() as unknown as UsuarioModel,
            )

            const result = await sut.find({
                status: StatusEvento.FINALIZADO,
                cpf_convidado: '123456789',
                cpf_organizador: '987654321',
                limite: 10,
                nome: 'Evento 1',
                pagina: 1,
            })

            expect(result).toStrictEqual({
                eventos: [],
                paginacao: {
                    total: 0,
                    pagina: 1,
                    limite: 10,
                },
            })
        })

        it(`deve tentar buscar o evento, mas setar o cpf do convidado como uma string vazia caso não seja encontrado`, async () => {
            const { sut, dataSourceMock, usuarioRepositoryMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    find: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)

            const repositoryMock = {
                update: jest.fn().mockResolvedValue({}),
                createQueryBuilder: jest.fn().mockReturnValue({
                    leftJoinAndSelect: jest.fn().mockReturnThis(),
                    leftJoin: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    orWhere: jest.fn().mockReturnThis(),
                    skip: jest.fn().mockReturnThis(),
                    take: jest.fn().mockReturnThis(),
                    addOrderBy: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([mockEventoModel.criarEvento1()]),
                    getCount: jest.fn().mockResolvedValue(1),
                }),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            jest.spyOn(usuarioRepositoryMock, 'findOneByCpf').mockResolvedValue(
                mockUsuarioModel.usuarioModel1() as unknown as UsuarioModel,
            )

            const result = await sut.find({
                status: StatusEvento.PENDENTE,
                cpf_convidado: '123456789',
                cpf_organizador: '987654321',
                limite: 10,
                nome: 'Evento 1',
                pagina: 1,
            })

            expect(result).toStrictEqual({
                eventos: [
                    {
                        id: '01J9SQF9YP9RYVMB61RCAS2BS1',
                        nome: 'Evento 1',
                        descricao: 'Descrição do evento 1',
                        dt_inicio_prevista: new Date('2024-12-17T02:39:00.000Z'),
                        dt_fim_prevista: new Date('2024-12-19T02:39:00.000Z'),
                        minutos_tolerancia: 10,
                        distancia_maxima_permitida: 100,
                        cpf_organizador: '123456789',
                        local: 'Local do evento 1',
                        latitude: 11111112,
                        longitude: 2222222,
                        status: StatusEvento.PENDENTE,
                        dt_criacao: new Date('2024-10-10T01:48:02.000Z'),
                        dt_ult_atualizacao: new Date('2024-10-10T01:48:02.000Z'),
                        convidados: { total: 2, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                        check_ins: { total: 1, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                        check_outs: { total: 2, emails: ['convidado1@email.com'] },
                    },
                ],
                paginacao: {
                    total: 1,
                    pagina: 1,
                    limite: 10,
                },
            })
        })

        it(`deve retornar os eventos encontrados`, async () => {
            const { sut, dataSourceMock, usuarioRepositoryMock } = sutFactory()

            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    find: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)

            const repositoryMock = {
                update: jest.fn().mockResolvedValue({}),
                createQueryBuilder: jest.fn().mockReturnValue({
                    leftJoinAndSelect: jest.fn().mockReturnThis(),
                    leftJoin: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    orWhere: jest.fn().mockReturnThis(),
                    skip: jest.fn().mockReturnThis(),
                    take: jest.fn().mockReturnThis(),
                    addOrderBy: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([]),
                    getCount: jest.fn().mockResolvedValue(0),
                }),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            jest.spyOn(usuarioRepositoryMock, 'findOneByCpf').mockResolvedValue(undefined)

            const result = await sut.find({
                status: StatusEvento.FINALIZADO,
                cpf_convidado: '123456789',
                cpf_organizador: '987654321',
                limite: 10,
                nome: 'Evento 1',
                pagina: 1,
            })

            expect(result).toStrictEqual({
                eventos: [],
                paginacao: {
                    total: 0,
                    pagina: 1,
                    limite: 10,
                },
            })
        })
    })

    describe(`${EventoRepository.prototype.update.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.update).toBeDefined()
        })

        it(`deve lançar um Error caso algum método retorne erro dentro do try/catch`, async () => {
            const { sut, dataSourceMock } = sutFactory()
            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    find: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)

            const repositoryMock = {
                update: jest.fn().mockRejectedValue(new Error('teste')),
                createQueryBuilder: jest.fn().mockReturnValue({
                    leftJoinAndSelect: jest.fn().mockReturnThis(),
                    leftJoin: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    orWhere: jest.fn().mockReturnThis(),
                    skip: jest.fn().mockReturnThis(),
                    take: jest.fn().mockReturnThis(),
                    addOrderBy: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([]),
                    getCount: jest.fn().mockResolvedValue(0),
                }),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            try {
                await sut.update(mockEventoModel.criarEvento1().id, {} as UpdateEventoDto)
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
                expect(error.message).toBe('Error: teste')
            }
        })

        it(`deve tentar atualizar o evento com todos os campos, exceto convidados`, async () => {
            const { sut, dataSourceMock } = sutFactory()
            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    find: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)

            const repositoryMock = {
                update: jest.fn().mockResolvedValue({}),
                createQueryBuilder: jest.fn().mockReturnValue({
                    leftJoinAndSelect: jest.fn().mockReturnThis(),
                    leftJoin: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    orWhere: jest.fn().mockReturnThis(),
                    skip: jest.fn().mockReturnThis(),
                    take: jest.fn().mockReturnThis(),
                    addOrderBy: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([]),
                    getCount: jest.fn().mockResolvedValue(0),
                }),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            jest.spyOn(sut, 'findById').mockResolvedValue({
                evento: {
                    nome: 'Evento 1',
                    descricao: 'Descrição do evento 1',
                    dt_inicio_prevista: mockEventoModel.criarEvento1().dt_inicio_prevista,
                    dt_fim_prevista: mockEventoModel.criarEvento1().dt_fim_prevista,
                    minutos_tolerancia: 10,
                    id: '01J9SQF9YP9RYVMB61RCAS2BS1',
                    distancia_maxima_permitida: 100,
                    cpf_organizador: '123456789',
                    local: 'Local do evento 1',
                    convidados: { total: 2, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                    latitude: '11111112',
                    longitude: '2222222',
                    status: StatusEvento.FINALIZADO,
                    dt_criacao: mockEventoModel.criarEvento1().dt_criacao,
                    dt_ult_atualizacao: mockEventoModel.criarEvento1().dt_ult_atualizacao,
                    dt_inicio: new Date('2024-10-10T01:48:02.000Z'),
                    dt_fim: new Date('2024-10-10T02:48:02.000Z'),
                    check_ins: { total: 2, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                    check_outs: { total: 1, emails: ['convidado1@email.com'] },
                },
            })

            const result = await sut.update(mockEventoModel.criarEvento1().id, {
                nome: 'Evento 1',
                descricao: 'Descrição do evento 1',
                dt_inicio_prevista: new Date('2024-12-17T02:39:00.000Z'),
                dt_fim_prevista: new Date('2024-12-19T02:39:00.000Z'),
                latitude: '11111112',
                longitude: '2222222',
                local: 'Local do evento 1',
                status: StatusEvento.PENDENTE,
                dt_fim: new Date('2024-12-19T02:39:00.000Z'),
                dt_inicio: new Date('2024-12-17T02:39:00.000Z'),
            } as UpdateEventoDto)

            expect(repositoryMock.update).toHaveBeenCalled()
            expect(result.evento.nome).toBe('Evento 1')
            expect(result.evento.descricao).toBe('Descrição do evento 1')
            expect(result.evento.local).toBe('Local do evento 1')
        })

        it(`deve atualizar lançar uma exceção e realizar rollback caso tente atualizar a lista de convidados e algo dê errado`, async () => {
            const { sut, dataSourceMock } = sutFactory()
            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    find: jest.fn(),
                    save: jest.fn().mockRejectedValue(new Error('teste')),
                    delete: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            dataSourceMock.createQueryRunner = jest.fn().mockReturnValue(queryRunnerMock)

            const repositoryMock = {
                update: jest.fn().mockResolvedValue({}),
                createQueryBuilder: jest.fn().mockReturnValue({
                    leftJoinAndSelect: jest.fn().mockReturnThis(),
                    leftJoin: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    orWhere: jest.fn().mockReturnThis(),
                    skip: jest.fn().mockReturnThis(),
                    take: jest.fn().mockReturnThis(),
                    addOrderBy: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([]),
                    getCount: jest.fn().mockResolvedValue(0),
                }),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            jest.spyOn(sut, 'findById').mockResolvedValue({
                evento: {
                    nome: 'Evento 1',
                    descricao: 'Descrição do evento 1',
                    dt_inicio_prevista: mockEventoModel.criarEvento1().dt_inicio_prevista,
                    dt_fim_prevista: mockEventoModel.criarEvento1().dt_fim_prevista,
                    minutos_tolerancia: 10,
                    id: '01J9SQF9YP9RYVMB61RCAS2BS1',
                    distancia_maxima_permitida: 100,
                    cpf_organizador: '123456789',
                    local: 'Local do evento 1',
                    convidados: { total: 2, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                    latitude: '11111112',
                    longitude: '2222222',
                    status: StatusEvento.FINALIZADO,
                    dt_criacao: mockEventoModel.criarEvento1().dt_criacao,
                    dt_ult_atualizacao: mockEventoModel.criarEvento1().dt_ult_atualizacao,
                    dt_inicio: new Date('2024-10-10T01:48:02.000Z'),
                    dt_fim: new Date('2024-10-10T02:48:02.000Z'),
                    check_ins: { total: 2, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                    check_outs: { total: 1, emails: ['convidado1@email.com'] },
                },
            })

            try {
                await sut.update(mockEventoModel.criarEvento1().id, {
                    convidados: ['email1@email.com', 'email2@email.com'],
                } as UpdateEventoDto)
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
                expect(error.message).toBe('Error: teste')
                expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled()
                expect(queryRunnerMock.release).toHaveBeenCalled()
            }
        })

        it(`deve atualizar a lista de convidados`, async () => {
            const { sut, dataSourceMock } = sutFactory()
            const queryRunnerMock = {
                connect: jest.fn(),
                startTransaction: jest.fn(),
                manager: {
                    find: jest.fn(),
                    save: jest.fn(),
                    delete: jest.fn(),
                },
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(queryRunnerMock)
            dataSourceMock.createQueryRunner = jest.fn().mockReturnValue(queryRunnerMock)

            const repositoryMock = {
                update: jest.fn().mockResolvedValue({}),
                createQueryBuilder: jest.fn().mockReturnValue({
                    leftJoinAndSelect: jest.fn().mockReturnThis(),
                    leftJoin: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    orWhere: jest.fn().mockReturnThis(),
                    skip: jest.fn().mockReturnThis(),
                    take: jest.fn().mockReturnThis(),
                    addOrderBy: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([]),
                    getCount: jest.fn().mockResolvedValue(0),
                }),
            }

            dataSourceMock.getRepository = jest.fn().mockReturnValue(repositoryMock)

            jest.spyOn(sut, 'findById').mockResolvedValue({
                evento: {
                    nome: 'Evento 1',
                    descricao: 'Descrição do evento 1',
                    dt_inicio_prevista: mockEventoModel.criarEvento1().dt_inicio_prevista,
                    dt_fim_prevista: mockEventoModel.criarEvento1().dt_fim_prevista,
                    minutos_tolerancia: 10,
                    id: '01J9SQF9YP9RYVMB61RCAS2BS1',
                    distancia_maxima_permitida: 100,
                    cpf_organizador: '123456789',
                    local: 'Local do evento 1',
                    convidados: { total: 2, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                    latitude: '11111112',
                    longitude: '2222222',
                    status: StatusEvento.FINALIZADO,
                    dt_criacao: mockEventoModel.criarEvento1().dt_criacao,
                    dt_ult_atualizacao: mockEventoModel.criarEvento1().dt_ult_atualizacao,
                    dt_inicio: new Date('2024-10-10T01:48:02.000Z'),
                    dt_fim: new Date('2024-10-10T02:48:02.000Z'),
                    check_ins: { total: 2, emails: ['convidado1@email.com', 'convidado2@email.com'] },
                    check_outs: { total: 1, emails: ['convidado1@email.com'] },
                },
            })

            const result = await sut.update(mockEventoModel.criarEvento1().id, {
                convidados: ['email1@email.com', 'email2@email.com'],
            } as UpdateEventoDto)

            expect(result.evento).toBeDefined()
            expect(result.evento.convidados).toBeDefined()
            expect(queryRunnerMock.commitTransaction).toHaveBeenCalled()
            expect(queryRunnerMock.release).toHaveBeenCalled()
        })
    })
})
