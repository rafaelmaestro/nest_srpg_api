import { CreateUsuarioDto } from '../dto/create-usuario.dto'

export const mockUsuario = {
    criarUsuario1: () => {
        return {
            cpf: '12345678901',
            nome: 'Usuario 1',
            senha: '123456',
            email: 'teste@gmail.com',
            foto: 'foto',
        } as unknown as CreateUsuarioDto
    },
}
