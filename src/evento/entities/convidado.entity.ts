export class Convidado {
    email_convidado: string
    id_evento: string
    check_ins: {
        id: string
        dt_hora_check_in?: Date
        dt_hora_check_out?: Date
    }[]
}
