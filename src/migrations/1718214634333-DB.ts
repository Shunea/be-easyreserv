import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1718214634333 implements MigrationInterface {
  name = 'DB1718214634333';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX \`IDX_e4a42b3824fc567b04ed1707b0\` ON \`bonus\` (\`restaurant_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_746b48fba7416f1dd67681b8dc\` ON \`communication_types\` (\`restaurant_id\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_746b48fba7416f1dd67681b8dc\` ON \`communication_types\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_e4a42b3824fc567b04ed1707b0\` ON \`bonus\``,
    );
  }
}
