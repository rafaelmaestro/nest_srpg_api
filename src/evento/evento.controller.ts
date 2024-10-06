import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { IsPublic } from '../auth/decorators/is-public.decorator'
import { CreateEventoDto } from './dto/create-evento.dto'
import { EventoService } from './evento.service'
import { UpdateEventoDto } from './dto/update-evento.dto'
import { CheckInDto } from './dto/check-in.dto'

@Controller('evento')
export class EventoController {
    constructor(private readonly eventoService: EventoService) {}

    @IsPublic()
    @Get('/hello')
    hello() {
        return {
            Message: 'Hello, world!',
            Date: new Date(),
        }
    }

    @IsPublic()
    @Post()
    create(@Body() createEventoDto: CreateEventoDto) {
        return this.eventoService.create(createEventoDto)
    }

    @Post('check-in/:id')
    checkIn(@Param('id') id: string, @Body() checkInDto: CheckInDto) {
        return this.eventoService.checkIn(id, checkInDto)
    }

    @Get('check-in/registros')
    checkInRegistros(@Query('id_evento') id_evento: string, @Query('email_convidado') email_convidado: string) {
        return this.eventoService.getRegistrosCheckIn(id_evento, email_convidado)
    }

    @Post('check-out/:id')
    checkOut(@Param('id') id: string, @Body() checkInDto: CheckInDto) {
        return this.eventoService.checkOut(id, checkInDto)
    }

    @Get()
    find(
        @Query('status') status: string,
        @Query('nome') nome: string,
        @Query('pagina') pagina: string,
        @Query('limite') limite: string,
        @Query('cpf_convidado') cpf_convidado: string,
        @Query('cpf_organizador') cpf_organizador: string,
    ) {
        return this.eventoService.find({ status, nome, pagina, limite, cpf_convidado, cpf_organizador })
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.eventoService.findOneById(id)
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateEventoDto: UpdateEventoDto) {
        return this.eventoService.update(id, updateEventoDto)
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.eventoService.remove(id)
    }

    @Get('/:id/presentes')
    getPresentes(@Param('id') id: string) {
        return this.eventoService.getPresentes(id)
    }

    @Post('/:id/relatorio')
    generateReport(@Param('id') id: string) {
        return this.eventoService.generateReport(id)
    }

    @Get('/lista/convidados')
    getListaConvidadosByNomeEvento(@Query('nome') nome: string) {
        return this.eventoService.getListaConvidadosByNomeEvento(nome)
    }
}
