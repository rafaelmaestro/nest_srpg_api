export interface SendMailConvidado {
    nomeEvento: string
    descricaoEvento: string
    dataEvento: Date
    localEvento: string
    nomeOrganizador: string
    emailsDestinatarios: string[]
}
