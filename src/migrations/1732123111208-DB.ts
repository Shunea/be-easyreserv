import { MigrationInterface, QueryRunner } from "typeorm";

export class DB1732123111208 implements MigrationInterface {
    name = 'DB1732123111208'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`pos\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` text NOT NULL, \`type\` enum ('MOBILE', 'FIXED', 'CLOUD') NOT NULL DEFAULT 'MOBILE', \`is_active\` tinyint NOT NULL DEFAULT 1, \`installation_date\` datetime NOT NULL, \`serial_number\` varchar(255) NOT NULL, \`provider\` varchar(255) NOT NULL, \`version\` varchar(255) NOT NULL, \`last_maintenance_date\` datetime NOT NULL, \`observations\` varchar(255) NULL, \`user\` varchar(255) NOT NULL, \`restaurant_id\` varchar(255) NULL, \`place_id\` varchar(255) NULL, INDEX \`IDX_2f1bf54ada6cafc9ac8985c668\` (\`restaurant_id\`), INDEX \`IDX_7059194912ac4e349cf0cbab6f\` (\`place_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`pos\` ADD CONSTRAINT \`FK_2f1bf54ada6cafc9ac8985c668a\` FOREIGN KEY (\`restaurant_id\`) REFERENCES \`restaurant\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pos\` DROP FOREIGN KEY \`FK_2f1bf54ada6cafc9ac8985c668a\``);
        await queryRunner.query(`DROP INDEX \`IDX_7059194912ac4e349cf0cbab6f\` ON \`pos\``);
        await queryRunner.query(`DROP INDEX \`IDX_2f1bf54ada6cafc9ac8985c668\` ON \`pos\``);
        await queryRunner.query(`DROP TABLE \`pos\``);
    }

}
