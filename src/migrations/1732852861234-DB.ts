import { MigrationInterface, QueryRunner } from "typeorm";

export class DB1732852861234 implements MigrationInterface {
    name = 'DB1732852861234'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`schedule\` ADD \`checkin_time\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`schedule\` ADD \`checkout_time\` datetime NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`schedule\` DROP COLUMN \`checkout_time\``);
        await queryRunner.query(`ALTER TABLE \`schedule\` DROP COLUMN \`checkin_time\``);
    }
} 