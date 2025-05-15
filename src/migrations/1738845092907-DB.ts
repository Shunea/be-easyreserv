import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1738845092907 implements MigrationInterface {
  name = 'DB1738845092907';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create trigger to remove waiter code when role changes from WAITER
    await queryRunner.query(`
      CREATE TRIGGER remove_waiter_code_on_role_change
      BEFORE UPDATE ON \`user\`
      FOR EACH ROW
      BEGIN
        IF OLD.role = 'WAITER' AND NEW.role != 'WAITER' THEN
          SET NEW.waiter_code = NULL;
        END IF;
      END;
    `);

    // Create trigger to add waiter code when role changes to WAITER
    await queryRunner.query(`
      CREATE TRIGGER add_waiter_code_on_role_change
      BEFORE UPDATE ON \`user\`
      FOR EACH ROW
      BEGIN
        DECLARE new_code VARCHAR(6);
        IF OLD.role != 'WAITER' AND NEW.role = 'WAITER' AND (NEW.waiter_code IS NULL OR NEW.waiter_code = '') THEN
          generate_code: LOOP
            SET new_code = LPAD(FLOOR(RAND() * 1000000), 6, '0');
            IF NOT EXISTS(SELECT 1 FROM \`user\` WHERE waiter_code = new_code) THEN
              SET NEW.waiter_code = new_code;
              LEAVE generate_code;
            END IF;
          END LOOP generate_code;
        END IF;
      END;
    `);

    // Clean up any existing inconsistencies
    await queryRunner.query(`
      UPDATE \`user\` 
      SET waiter_code = NULL 
      WHERE role != 'WAITER' AND waiter_code IS NOT NULL;
    `);

    // Ensure all waiters have codes
    await queryRunner.query(`
      UPDATE \`user\` u1
      SET waiter_code = (
        SELECT LPAD(FLOOR(RAND() * 1000000), 6, '0')
        FROM (SELECT 1) dummy
        WHERE NOT EXISTS (
          SELECT 1 FROM (SELECT * FROM \`user\`) u2 
          WHERE u2.waiter_code = LPAD(FLOOR(RAND() * 1000000), 6, '0')
        )
        LIMIT 1
      )
      WHERE role = 'WAITER' AND (waiter_code IS NULL OR waiter_code = '');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the triggers in reverse order
    await queryRunner.query('DROP TRIGGER IF EXISTS add_waiter_code_on_role_change;');
    await queryRunner.query('DROP TRIGGER IF EXISTS remove_waiter_code_on_role_change;');
  }
} 