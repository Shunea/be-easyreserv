import { MigrationInterface, QueryRunner } from "typeorm";

export class DB1732852861235 implements MigrationInterface {
    name = 'DB1732852861235'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`current_schedule_id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_user_current_schedule\` FOREIGN KEY (\`current_schedule_id\`) REFERENCES \`schedule\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_user_current_schedule\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`current_schedule_id\``);
    }
} 