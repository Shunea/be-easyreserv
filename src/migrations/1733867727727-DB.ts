import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1733867727727 implements MigrationInterface {
    name = 'DB1733867727727'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add GENERAL to the role enum
        await queryRunner.query(
            `ALTER TABLE \`user\` MODIFY COLUMN \`role\` ENUM('SUPER_ADMIN', 'ADMIN', 'USER', 'BARTENDER', 'CHEF', 'DRIVER', 'HOSTESS', 'OPERATOR', 'SOUS_CHEF', 'SPECIALIST', 'SUPER_HOSTESS', 'WAITER', 'COURIER', 'STAFF_ACCESS_CONTROL', 'GENERAL') NOT NULL DEFAULT 'USER'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> { 
        // Revert the role enum to its original state
        await queryRunner.query(
            `ALTER TABLE \`user\` MODIFY COLUMN \`role\` ENUM('SUPER_ADMIN', 'ADMIN', 'USER', 'BARTENDER', 'CHEF', 'DRIVER', 'HOSTESS', 'OPERATOR', 'SOUS_CHEF', 'SPECIALIST', 'SUPER_HOSTESS', 'WAITER', 'COURIER', 'GENERAL') NOT NULL DEFAULT 'USER'`
        );
    }
} 