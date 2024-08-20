import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveForeignKeyConstraintFromConvidadoEvento1680000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE convidado_evento 
            DROP FOREIGN KEY email_convidado;
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE convidado_evento 
            ADD CONSTRAINT email_convidado FOREIGN KEY (email_convidado) REFERENCES usuario(email);
        `)
    }
}
