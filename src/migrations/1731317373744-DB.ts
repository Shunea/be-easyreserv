import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1731317373744 implements MigrationInterface {
  name = 'DB1731317373744';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`payment_accounts\` (\`id\` varchar(36) NOT NULL, \`receipt_number\` varchar(255) NOT NULL, \`order_id\` varchar(36) NOT NULL, \`restaurant_id\` varchar(36) NOT NULL, \`payment_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, \`payment_type\` enum ('CASH', 'POS', 'TRANSFER') NOT NULL, \`amount\` decimal(10,2) NOT NULL, \`discount_percent\` decimal(5,2) NOT NULL DEFAULT '0.00', \`discount_value\` decimal(10,2) NOT NULL DEFAULT '0.00', \`payment_status\` enum ('PROCESSED', 'CANCELLED', 'PENDING') NOT NULL DEFAULT 'PENDING', \`operator_id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_208a765ce4268490f6f80f26cb\` (\`receipt_number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`payment_accounts\` ADD CONSTRAINT \`FK_d0e6c87e89c53bf81397c552974\` FOREIGN KEY (\`restaurant_id\`) REFERENCES \`restaurant\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`department\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`payment_accounts\` DROP FOREIGN KEY \`FK_d0e6c87e89c53bf81397c552974\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_208a765ce4268490f6f80f26cb\` ON \`payment_accounts\``,
    );
    await queryRunner.query(`DROP TABLE \`payment_accounts\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`department\``);
  }
}
