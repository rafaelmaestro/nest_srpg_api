import { Body, Controller, Get, Post } from '@nestjs/common'
import { IsPublic } from '../auth/decorators/is-public.decorator'
import { CreateEventoDto } from './dto/create-evento.dto'
import { EventoService } from './evento.service'

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

    // @Get()
    // findAll() {
    //     return this.eventoService.findAll()
    // }

    // @Get(':id')
    // findOne(@Param('id') id: string) {
    //     return this.eventoService.findOne(+id)
    // }

    // @Patch(':id')
    // update(@Param('id') id: string, @Body() updateEventoDto: UpdateEventoDto) {
    //     return this.eventoService.update(+id, updateEventoDto)
    // }

    // @Delete(':id')
    // remove(@Param('id') id: string) {
    //     return this.eventoService.remove(+id)
    // }
}
