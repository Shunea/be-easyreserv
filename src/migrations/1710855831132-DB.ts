import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1710855831132 implements MigrationInterface {
  name = 'DB1710855831132';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`transport\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`registration_number\` varchar(255) NOT NULL, \`seats\` int NOT NULL, \`mileage\` int NOT NULL DEFAULT '0', \`region\` varchar(255) NOT NULL, \`type\` varchar(255) NOT NULL, \`restaurant_id\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_f1221c1334e040b1798cf84f99\` (\`registration_number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`transport_user\` (\`transport_id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, INDEX \`IDX_4b4e76a48e37501d0b1f7fcaf6\` (\`transport_id\`), INDEX \`IDX_34d4bdb9d16dec67d6bbcacd59\` (\`user_id\`), PRIMARY KEY (\`transport_id\`, \`user_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`role\` \`role\` enum ('SUPER_ADMIN', 'ADMIN', 'USER', 'WAITER', 'CHEF', 'HOSTESS', 'SUPER_HOSTESS', 'OPERATOR', 'SPECIALIST', 'DRIVER') NOT NULL DEFAULT 'USER'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transport_user\` ADD CONSTRAINT \`FK_4b4e76a48e37501d0b1f7fcaf6b\` FOREIGN KEY (\`transport_id\`) REFERENCES \`transport\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transport_user\` ADD CONSTRAINT \`FK_34d4bdb9d16dec67d6bbcacd596\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`transport_user\` DROP FOREIGN KEY \`FK_34d4bdb9d16dec67d6bbcacd596\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transport_user\` DROP FOREIGN KEY \`FK_4b4e76a48e37501d0b1f7fcaf6b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`role\` \`role\` enum ('SUPER_ADMIN', 'ADMIN', 'USER', 'WAITER', 'CHEF', 'HOSTESS', 'SUPER_HOSTESS', 'OPERATOR', 'SPECIALIST') NOT NULL DEFAULT 'USER'`,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_34d4bdb9d16dec67d6bbcacd59\` ON \`transport_user\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_4b4e76a48e37501d0b1f7fcaf6\` ON \`transport_user\``,
    );
    await queryRunner.query(`DROP TABLE \`transport_user\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_f1221c1334e040b1798cf84f99\` ON \`transport\``,
    );
    await queryRunner.query(`DROP TABLE \`transport\``);
  }
}
