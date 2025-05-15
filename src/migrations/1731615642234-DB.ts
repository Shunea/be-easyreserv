import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1731615642234 implements MigrationInterface {
  name = 'DB1731615642234';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create delivery_orders table
    await queryRunner.query(`
            CREATE TABLE \`delivery_orders\` (
                \`id\` varchar(36) NOT NULL,
                \`restaurant_id\` varchar(36) NOT NULL,
                \`operator_id\` varchar(36) NOT NULL,
                \`client_name\` varchar(255) NOT NULL,
                \`client_phone\` varchar(20) NOT NULL,
                \`comments\` text NULL,
                \`address_entrance\` varchar(255) NOT NULL,
                \`address_staircase\` varchar(50) NULL,
                \`address_floor\` varchar(10) NULL,
                \`address_intercom\` varchar(50) NULL,
                \`payment_type\` enum('CASH', 'POS', 'TRANSFER') NOT NULL,
                \`total_amount\` decimal(10,2) NOT NULL,
                \`courier_id\` varchar(36) NULL,
                \`courier_phone\` varchar(20) NULL,
                \`courier_status\` enum('PENDING', 'IN_PREPARATION', 'PICKED_UP', 'DELIVERED', 'CANCELLED') NOT NULL,
                \`courier_pickup_time\` datetime NULL,
                \`estimated_delivery_time\` int NOT NULL,
                \`estimated_preparation_time\` int NOT NULL,
                \`operator_status\` enum('CONFIRM', 'REJECT', 'MODIFY', 'PENDING') NOT NULL,
                \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`deleted_at\` datetime NULL,
                \`operator_modified_at\` datetime NOT NULL,
                \`order_date\` datetime NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

    // Create delivery_order_items table
    await queryRunner.query(`
            CREATE TABLE \`delivery_order_items\` (
                \`id\` varchar(36) NOT NULL,
                \`order_id\` varchar(36) NOT NULL,
                \`product_id\` varchar(36) NOT NULL,
                \`quantity\` int NOT NULL,
                \`price\` decimal(10,2) NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

    // Add delivery_enabled to restaurant table
    await queryRunner.query(`
            ALTER TABLE \`restaurant\` 
            ADD \`delivery_enabled\` tinyint NOT NULL DEFAULT 0
        `);

    // Add is_available to product table
    await queryRunner.query(`
            ALTER TABLE \`product\` 
            ADD \`is_available\` tinyint NOT NULL DEFAULT 1
        `);

    // Update user roles to include COURIER
    await queryRunner.query(`
            ALTER TABLE \`user\` 
            MODIFY COLUMN \`role\` enum('SUPER_ADMIN', 'ADMIN', 'USER', 'BARTENDER', 'CHEF', 'DRIVER', 'HOSTESS', 'OPERATOR', 'SOUS_CHEF', 'SPECIALIST', 'SUPER_HOSTESS', 'WAITER', 'COURIER') 
            NOT NULL DEFAULT 'USER'
        `);

    // Add foreign key constraints
    await queryRunner.query(`
            ALTER TABLE \`delivery_orders\`
            ADD CONSTRAINT \`FK_restaurant_delivery\` 
            FOREIGN KEY (\`restaurant_id\`) REFERENCES \`restaurant\`(\`id\`)
        `);

    await queryRunner.query(`
            ALTER TABLE \`delivery_orders\`
            ADD CONSTRAINT \`FK_operator_delivery\` 
            FOREIGN KEY (\`operator_id\`) REFERENCES \`user\`(\`id\`)
        `);

    await queryRunner.query(`
            ALTER TABLE \`delivery_orders\`
            ADD CONSTRAINT \`FK_courier_delivery\` 
            FOREIGN KEY (\`courier_id\`) REFERENCES \`user\`(\`id\`)
        `);

    await queryRunner.query(`
            ALTER TABLE \`delivery_order_items\`
            ADD CONSTRAINT \`FK_order_items\` 
            FOREIGN KEY (\`order_id\`) REFERENCES \`delivery_orders\`(\`id\`)
        `);

    await queryRunner.query(`
            ALTER TABLE \`delivery_order_items\`
            ADD CONSTRAINT \`FK_product_items\` 
            FOREIGN KEY (\`product_id\`) REFERENCES \`product\`(\`id\`)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE \`delivery_order_items\` DROP FOREIGN KEY \`FK_product_items\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`delivery_order_items\` DROP FOREIGN KEY \`FK_order_items\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`delivery_orders\` DROP FOREIGN KEY \`FK_courier_delivery\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`delivery_orders\` DROP FOREIGN KEY \`FK_operator_delivery\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`delivery_orders\` DROP FOREIGN KEY \`FK_restaurant_delivery\``,
    );
    await queryRunner.query(`
            ALTER TABLE delivery_orders 
            ADD COLUMN courier_latitude DECIMAL(10,7) NULL,
            ADD COLUMN courier_longitude DECIMAL(10,7) NULL,
            ADD COLUMN client_latitude DECIMAL(10,7) NULL,
            ADD COLUMN client_longitude DECIMAL(10,7) NULL
        `);
    // Revert user roles
    await queryRunner.query(`
            ALTER TABLE \`user\` 
            MODIFY COLUMN \`role\` enum('SUPER_ADMIN', 'ADMIN', 'USER', 'BARTENDER', 'CHEF', 'DRIVER', 'HOSTESS', 'OPERATOR', 'SOUS_CHEF', 'SPECIALIST', 'SUPER_HOSTESS', 'WAITER') 
            NOT NULL DEFAULT 'USER'
        `);

    // Drop is_available from product
    await queryRunner.query(
      `ALTER TABLE \`product\` DROP COLUMN \`is_available\``,
    );

    // Drop delivery_enabled from restaurant
    await queryRunner.query(
      `ALTER TABLE \`restaurant\` DROP COLUMN \`delivery_enabled\``,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE \`delivery_order_items\``);
    await queryRunner.query(`DROP TABLE \`delivery_orders\``);
  }
}
