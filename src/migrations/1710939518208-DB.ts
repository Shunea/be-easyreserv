import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1710939518208 implements MigrationInterface {
  name = 'DB1710939518208';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_01eea41349b6c9275aec646eee\` ON \`user\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_d055cac5f0f06d57b0a3b1fe57\` ON \`restaurant\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_f5718b24886dfaa270caf66ca7\` ON \`restaurant\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`phone_number\` \`phone_number\` varchar(255) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`phone_number\` \`phone_number\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_f5718b24886dfaa270caf66ca7\` ON \`restaurant\` (\`phone_number\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_d055cac5f0f06d57b0a3b1fe57\` ON \`restaurant\` (\`email\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_01eea41349b6c9275aec646eee\` ON \`user\` (\`phone_number\`)`,
    );
  }
}
