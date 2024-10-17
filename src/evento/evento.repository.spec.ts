import { DataSource } from 'typeorm'
import { setEnv } from '../../config'
import { UsuarioRepository } from '../usuario/usuario.repository'
import { mockEvento } from './__mocks__/evento.mock'
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

            console.log(result)

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

            console.log(result)

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
    })

    describe(`${EventoRepository.prototype.checkOut.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.checkOut).toBeDefined()
        })
    })

    describe(`${EventoRepository.prototype.update.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.update).toBeDefined()
        })
    })

    describe(`${EventoRepository.prototype.find.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.find).toBeDefined()
        })
    })
})
