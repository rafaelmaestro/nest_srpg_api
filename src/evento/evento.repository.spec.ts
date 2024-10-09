import { DataSource } from 'typeorm'
import { setEnv } from '../../config'
import { UsuarioRepository } from '../usuario/usuario.repository'
import { mockEvento } from './__mocks__/evento.mock'
import { EventoRepository } from './evento.repository'
import { mockEventoModel } from './models/__mocks__/evento.model.mock'

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

            mockEventoModel.criarEvento1()

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
})
