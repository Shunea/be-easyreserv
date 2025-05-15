import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1738845092906 implements MigrationInterface {
  name = 'DB1738845092906';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add waiter code column with unique constraint
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`waiter_code\` varchar(6) NULL UNIQUE`,
    );

    // Add index for faster lookups
    await queryRunner.query(
      `CREATE INDEX \`IDX_USER_WAITER_CODE\` ON \`user\` (\`waiter_code\`)`,
    );

    // Generate initial codes for existing waiters
    await queryRunner.query(`
      UPDATE \`user\` 
      SET \`waiter_code\` = LPAD(FLOOR(RAND() * 1000000), 6, '0')
      WHERE \`role\` = 'WAITER' AND (\`waiter_code\` IS NULL OR \`waiter_code\` = '')
    `);

    // Create a trigger to automatically generate codes for new waiters
    await queryRunner.query(`
      CREATE TRIGGER generate_waiter_code
      BEFORE INSERT ON \`user\`
      FOR EACH ROW
      BEGIN
        IF NEW.role = 'WAITER' AND (NEW.waiter_code IS NULL OR NEW.waiter_code = '') THEN
          SET @code = LPAD(FLOOR(RAND() * 1000000), 6, '0');
          WHILE EXISTS(SELECT 1 FROM \`user\` WHERE waiter_code = @code) DO
            SET @code = LPAD(FLOOR(RAND() * 1000000), 6, '0');
          END WHILE;
          SET NEW.waiter_code = @code;
        END IF;
      END;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the trigger first
    await queryRunner.query(`DROP TRIGGER IF EXISTS generate_waiter_code`);

    // Drop the index
    await queryRunner.query(
      `DROP INDEX \`IDX_USER_WAITER_CODE\` ON \`user\``,
    );

    // Drop the column
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP COLUMN \`waiter_code\``,
    );
  }
} 