import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1731518087291 implements MigrationInterface {
  name = 'DB1731518087291';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`invoice\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`issue_date\` datetime NULL, \`business_name\` varchar(255) NOT NULL, \`business_type\` enum ('RESTAURANT', 'BEAUTY_SALON', 'CAR_WASH') NOT NULL, \`subscription_type\` enum ('BASIC', 'STANDARD', 'PRO') NOT NULL DEFAULT 'BASIC', \`subscription_sum\` decimal(10,2) NOT NULL DEFAULT '0.00', \`billingPeriod\` varchar(50) NULL, \`payment_status\` enum ('PAID', 'UNPAID') NOT NULL DEFAULT 'UNPAID', \`business_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoice\` ADD CONSTRAINT \`FK_e1ac36addedd845e1ef2d1225f6\` FOREIGN KEY (\`business_id\`) REFERENCES \`place\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`invoice\` DROP FOREIGN KEY \`FK_e1ac36addedd845e1ef2d1225f6\``,
    );
    await queryRunner.query(`DROP TABLE \`invoice\``);
  }
}
