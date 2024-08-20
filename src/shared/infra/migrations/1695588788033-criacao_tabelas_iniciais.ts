import { MigrationInterface, QueryRunner } from 'typeorm'

export class CriacaoTabelasIniciais1695588788033 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS public.usuario (
                cpf VARCHAR(15) NOT NULL,
                email VARCHAR(155) NOT NULL,
                nome VARCHAR(155) NOT NULL,
                dt_criacao DATETIME NOT NULL DEFAULT NOW(),
                dt_ult_atualizacao DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
                senha VARCHAR(255) NOT NULL,
                PRIMARY KEY (cpf),
                UNIQUE INDEX email_UNIQUE (email)
        )`,
        )

        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS public.biometria_usuario (
                foto longblob NOT NULL,
                cpf VARCHAR(15) NOT NULL,
                dt_criacao DATETIME NOT NULL DEFAULT NOW(),
                dt_ult_atualizacao DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
                id VARCHAR(100) NOT NULL,
                INDEX cpf_idx (cpf_usuario ASC) VISIBLE,
                PRIMARY KEY (id),
                CONSTRAINT cpf_usuario_fk
                    FOREIGN KEY (cpf)
                    REFERENCES public.usuario (cpf)
        )`,
        )

        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS public.localizacao_usuario (
                latitude VARCHAR(255) NOT NULL,
                longitude VARCHAR(255) NULL,
                dt_criacao DATETIME NOT NULL DEFAULT NOW(),
                dt_ult_atualizacao DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
                id VARCHAR(155) NOT NULL,
                cpf_usuario VARCHAR(15) NOT NULL,
                PRIMARY KEY (id),
                INDEX id_usuario_idx (cpf_usuario),
                UNIQUE INDEX cpf_usuario_UNIQUE (cpf_usuario),
                CONSTRAINT cpf_usuario
                    FOREIGN KEY (cpf_usuario)
                    REFERENCES public.usuario (cpf)
        )`,
        )

        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS public.evento (
                id VARCHAR(155) NOT NULL,
                nome VARCHAR(255) NOT NULL,
                descricao VARCHAR(255) NOT NULL,
                data_hora DATETIME NOT NULL,
                latitude VARCHAR(155) NOT NULL,
                longitude VARCHAR(155) NOT NULL,
                dt_criacao DATETIME NULL DEFAULT NOW(),
                dt_ult_atualizacao DATETIME NULL DEFAULT NOW() ON UPDATE NOW(),
                cpf_organizador VARCHAR(15) NULL,
                local VARCHAR(200) NOT NULL,
                PRIMARY KEY (id),
                INDEX organizador_idx (cpf_organizador ASC),
                CONSTRAINT organizador
                    FOREIGN KEY (cpf_organizador)
                    REFERENCES public.usuario (cpf)
        )`,
        )

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS public.convidado_evento (
                email_convidado VARCHAR(155) NOT NULL,
                dt_criacao DATETIME NOT NULL DEFAULT NOW(),
                dt_ult_atualizacao DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
                id_evento VARCHAR(155) NOT NULL,
                PRIMARY KEY (email_convidado, id_evento),
                INDEX id_evento_idx (id_evento ASC),
                CONSTRAINT email_convidado
                    FOREIGN KEY (email_convidado)
                    REFERENCES public.usuario (cpf)
                    ON DELETE NO ACTION
                    ON UPDATE NO ACTION,
                CONSTRAINT id_evento
                    FOREIGN KEY (id_evento)
                    REFERENCES public.evento (id)
        )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS public.convidado_evento`)
        await queryRunner.query(`DROP TABLE IF EXISTS public.evento`)
        await queryRunner.query(`DROP TABLE IF EXISTS public.localizacao_usuario`)
        await queryRunner.query(`DROP TABLE IF EXISTS public.biometria_base`)
        await queryRunner.query(`DROP TABLE IF EXISTS public.usuario`)
    }
}
