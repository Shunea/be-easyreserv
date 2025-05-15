import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1732852861236 implements MigrationInterface {
    name = 'DB1732852861236'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add GENERAL to the role enum
        await queryRunner.query(
            `ALTER TABLE \`user\` MODIFY COLUMN \`role\` ENUM('SUPER_ADMIN', 'ADMIN', 'USER', 'BARTENDER', 'CHEF', 'DRIVER', 'HOSTESS', 'OPERATOR', 'SOUS_CHEF', 'SPECIALIST', 'SUPER_HOSTESS', 'WAITER', 'COURIER', 'GENERAL') NOT NULL DEFAULT 'USER'`
        );
        
        // Add the role_name column
        await queryRunner.query(
            `ALTER TABLE \`user\` ADD COLUMN \`role_name\` varchar(255) NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the role_name column
        await queryRunner.query(
            `ALTER TABLE \`user\` DROP COLUMN \`role_name\``
        );
        
        // Revert the role enum to its original state
        await queryRunner.query(
            `ALTER TABLE \`user\` MODIFY COLUMN \`role\` ENUM('SUPER_ADMIN', 'ADMIN', 'USER', 'BARTENDER', 'CHEF', 'DRIVER', 'HOSTESS', 'OPERATOR', 'SOUS_CHEF', 'SPECIALIST', 'SUPER_HOSTESS', 'WAITER', 'COURIER') NOT NULL DEFAULT 'USER'`
        );
    }
} 