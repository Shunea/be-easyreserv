import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1732852861240 implements MigrationInterface {
  name = 'DB1732852861240';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`delivery_orders\` ADD \`client_latitude\` DOUBLE(10,7) NULL COMMENT 'Client location latitude'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`delivery_orders\` ADD \`client_longitude\` DOUBLE(11,7) NULL COMMENT 'Client location longitude'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`delivery_orders\` ADD \`courier_latitude\` DOUBLE(10,7) NULL COMMENT 'Courier location latitude'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`delivery_orders\` ADD \`courier_longitude\` DOUBLE(11,7) NULL COMMENT 'Courier location longitude'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`delivery_orders\` DROP COLUMN \`courier_longitude\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`delivery_orders\` DROP COLUMN \`courier_latitude\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`delivery_orders\` DROP COLUMN \`client_longitude\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`delivery_orders\` DROP COLUMN \`client_latitude\``,
    );
  }
} 