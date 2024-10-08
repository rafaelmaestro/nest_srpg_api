export const mockUsuarioModel = {
    usuarioModel1: () => {
        return {
            cpf: '123456789',
            nome: 'João da Silva',
            email: 'joaodasilva@live.com.br',
            hash_recuperacao_senha: '$2b$10$nHDGVTjMS3SjycwKYV.KVer.Xx0Ta6iur29zxRmQHQPYDgX0MSNGO',
            senha: '$2b$10$oRtlO6Hw3RQU40wmEP1tF.pL6y8fXu0BWKM7lOwVFPA9ffBVqRYI6',
            dt_criacao: new Date(),
            dt_ult_atualizacao: new Date(),
            biometria: {
                id: '01J7S79QVAW1WS53SCWDDDM6JG',
                foto: new Uint8Array([]),
                cpf: '123456789',
                dt_criacao: '2024-09-15T00:33:51.000Z',
                dt_ult_atualizacao: '2024-09-15T00:33:51.000Z',
            },
        }
    },
}
