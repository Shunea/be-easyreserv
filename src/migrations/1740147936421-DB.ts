import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1740147936421 implements MigrationInterface {
  name = 'DB1740147936421';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add readyAt column
    await queryRunner.query(`
      ALTER TABLE \`order\` 
      ADD COLUMN \`ready_at\` datetime NULL
    `);

    // Create trigger to update readyAt when status changes to READY
    await queryRunner.query(`
      CREATE TRIGGER update_ready_at_on_status_change
      BEFORE UPDATE ON \`order\`
      FOR EACH ROW
      BEGIN
        IF NEW.status = 'READY' AND (OLD.status != 'READY' OR OLD.status IS NULL) THEN
          SET NEW.ready_at = CURRENT_TIMESTAMP;
        END IF;
      END;
    `);

    // Add index for better performance on status+readyAt queries
    await queryRunner.query(`
      CREATE INDEX \`IDX_RESERVATION_STATUS_READY_AT\` 
      ON \`order\` (\`status\`, \`ready_at\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the trigger first
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_ready_at_on_status_change`);
    
    // Drop the index
    await queryRunner.query(`DROP INDEX \`IDX_RESERVATION_STATUS_READY_AT\` ON \`order\``);
    
    // Drop the column
    await queryRunner.query(`ALTER TABLE \`order\` DROP COLUMN \`ready_at\``);
  }
} 