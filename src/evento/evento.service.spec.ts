import { BadRequestException, NotFoundException } from '@nestjs/common'
import { setEnv } from '../../config'
import { EMailerService } from '../mailer/mailer.service'
import { UsuarioService } from '../usuario/usuario.service'
import { CheckInDto } from './dto/check-in.dto'
import { CreateEventoDto } from './dto/create-evento.dto'
import { StatusEvento } from './entities/evento.entity'
import { EventoRepository } from './evento.repository'
import { EventoService } from './evento.service'
import { mockConvidadoModel } from './models/__mocks__/convidado-evento.model'
import { mockEventoModel } from './models/__mocks__/evento.model.mock'

setEnv()

const EventoRepositoryMock = EventoRepository as unknown as jest.Mock<EventoRepository>
const UsuarioServiceMock = UsuarioService as unknown as jest.Mock<UsuarioService>
const EMailerServiceMock = EMailerService as unknown as jest.Mock<EMailerService>

const sutFactory = () => {
    const eventoRepositoryMock = new EventoRepositoryMock() as jest.Mocked<EventoRepository>
    const usuarioServiceMock = new UsuarioServiceMock() as jest.Mocked<UsuarioService>
    const mailerServiceMock = new EMailerServiceMock() as jest.Mocked<EMailerService>

    const sut = new EventoService(eventoRepositoryMock, usuarioServiceMock, mailerServiceMock)
    return { sut, eventoRepositoryMock, usuarioServiceMock, mailerServiceMock }
}

describe(`${EventoService.name} suite`, () => {
    it(`deve estar definido`, () => {
        const { sut } = sutFactory()
        expect(sut).toBeDefined()
    })

    describe(`${EventoService.prototype.create.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.create).toBeDefined()
        })

        it(`deve lançar NotFoundException caso não encontre o usuário com o CPF informado como organizador`, async () => {
            const { sut, usuarioServiceMock } = sutFactory()

            jest.spyOn(usuarioServiceMock, 'findByCpf').mockResolvedValue(null)

            try {
                await sut.create({ cpf_organizador: '123' } as unknown as CreateEventoDto)
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(NotFoundException)
                expect(error.message).toBe('Usuário não encontrado com o CPF informado: 123')
            }
        })

        it(`deve criar o evento e enviar e-mails para os convidados`, async () => {
            const { sut, eventoRepositoryMock, usuarioServiceMock, mailerServiceMock } = sutFactory()

            jest.spyOn(usuarioServiceMock, 'findByCpf').mockResolvedValue({ nome: 'nome' } as any)
            jest.spyOn(eventoRepositoryMock, 'save').mockResolvedValue({
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
            jest.spyOn(mailerServiceMock, 'sendMailConvidado').mockReturnValue({} as any)

            const result = await sut.create({ cpf_organizador: '123' } as unknown as CreateEventoDto)

            expect(result).toBeDefined()
            expect(result.evento).toBeDefined()
            expect(mailerServiceMock.sendMailConvidado).toHaveBeenCalled()
            expect(mailerServiceMock.sendMailConvidado).toHaveBeenCalled()
        })
    })

    describe(`${EventoService.prototype.getRegistrosCheckIn.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.getRegistrosCheckIn).toBeDefined()
        })

        it(`deve lançar BadRequestException caso o ID do evento não seja informado`, async () => {
            const { sut } = sutFactory()

            try {
                await sut.getRegistrosCheckIn('', 'email')
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException)
                expect(error.message).toBe('Informe o ID do evento para realizar a busca dos registros de check-in')
            }
        })

        it(`deve lançar BadRequestException caso o e-mail do convidado não seja informado`, async () => {
            const { sut } = sutFactory()

            try {
                await sut.getRegistrosCheckIn('id', '')
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException)
                expect(error.message).toBe(
                    'Informe o e-mail do usuário para realizar a busca dos registros de check-in',
                )
            }
        })

        it(`deve retornar os registros de check-in do convidado`, async () => {
            const { sut, eventoRepositoryMock } = sutFactory()

            jest.spyOn(eventoRepositoryMock, 'getRegistrosCheckIn').mockResolvedValue({
                registros: [
                    {
                        id: 'id',
                        dt_hora_check_in: new Date(),
                        dt_hora_check_out: new Date(),
                    },
                ],
            })

            const result = await sut.getRegistrosCheckIn('id_evento', 'email_convidado')

            expect(result).toBeDefined()
            expect(result.registros).toBeDefined()
            expect(result.registros.length).toBe(1)
            expect(result.registros[0].id).toBe('id')
        })
    })

    describe(`${EventoService.prototype.findOneById.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.findOneById).toBeDefined()
        })

        it(`deve retornar o evento com o ID informado`, async () => {
            const { sut, eventoRepositoryMock } = sutFactory()

            jest.spyOn(eventoRepositoryMock, 'findById').mockResolvedValue({
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

            const result = await sut.findOneById('id')

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
        })
    })

    describe(`${EventoService.prototype.remove.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.remove).toBeDefined()
        })

        it(`deve executar o método que realiza a exclusão do evento`, async () => {
            const { sut, eventoRepositoryMock } = sutFactory()

            jest.spyOn(eventoRepositoryMock, 'remove').mockResolvedValue({} as any)

            await sut.remove('id')

            expect(eventoRepositoryMock.remove).toHaveBeenCalled()
        })
    })

    describe(`${EventoService.prototype.checkIn.name}()`, () => {
        it(`deve estar definido`, () => {
            const { sut } = sutFactory()
            expect(sut.checkIn).toBeDefined()
        })

        it(`deve lançar BadRequestException caso o ID do evento não seja informado`, async () => {
            const { sut } = sutFactory()

            try {
                await sut.checkIn('', {} as unknown as CheckInDto)
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException)
                expect(error.message).toBe('Informe o ID do evento para realizar o check-in')
            }
        })

        it(`deve lançar BadRequestException caso o e-mail do convidado não seja informado`, async () => {
            const { sut } = sutFactory()

            try {
                await sut.checkIn('id', {} as unknown as CheckInDto)
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException)
                expect(error.message).toBe('Informe o e-mail do usuário para realizar o check-in')
            }
        })

        it(`deve lançar NotFoundException caso o evento não seja encontrado`, async () => {
            const { sut, eventoRepositoryMock } = sutFactory()

            jest.spyOn(eventoRepositoryMock, 'findById').mockResolvedValue(null)

            try {
                await sut.checkIn('id', { email_convidado: 'email' } as unknown as CheckInDto)
                fail('A exceção não foi lançada')
            } catch (error) {
                expect(error).toBeInstanceOf(NotFoundException)
                expect(error.message).toBe('Evento não encontrado com o ID informado: id')
            }
        })

        it(`deve realizar o check-in do convidado`, async () => {
            const { sut, eventoRepositoryMock } = sutFactory()

            jest.spyOn(eventoRepositoryMock, 'findById').mockResolvedValue({
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
            jest.spyOn(eventoRepositoryMock, 'checkIn').mockResolvedValue({
                registros: [
                    ...mockConvidadoModel.criarConvidado1().check_ins,
                    {
                        id: expect.any(String),
                        dt_hora_check_in: expect.any(Date),
                        dt_hora_check_out: null,
                    },
                ],
            })

            const result = await sut.checkIn('id', { email_convidado: 'email' } as unknown as CheckInDto)

            expect(eventoRepositoryMock.checkIn).toHaveBeenCalled()
            expect(result).toBeDefined()
            expect(result.registros).toBeDefined()
        })
    })
})
