import { MigrationInterface, QueryRunner } from "typeorm";

export class DB1732852861241 implements MigrationInterface {
    name = 'DB1732852861241'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`schedule\` ADD \`deletion_notice\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`schedule\` DROP COLUMN \`deletion_notice\``);
    }
} 