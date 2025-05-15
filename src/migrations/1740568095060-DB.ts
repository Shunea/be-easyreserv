import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1740568095060 implements MigrationInterface {
  name = 'DB1740568095060';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`semifinished_product\`
                             (
                                 \`id\`            varchar(36)  NOT NULL,
                                 \`created_at\`    datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                                 \`updated_at\`    datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                                 \`deleted_at\`    datetime(6)  NULL,
                                 \`name\`          varchar(255) NOT NULL,
                                 \`quantity\`      int          NOT NULL,
                                 \`restaurant_id\` varchar(255) NOT NULL,
                                 \`product_id\`    varchar(36)  NULL,
                                 INDEX \`IDX_e73d328c7afd7a53a5b3675ab6\` (\`restaurant_id\`),
                                 PRIMARY KEY (\`id\`)
                             ) ENGINE = InnoDB`);
    await queryRunner.query(`ALTER TABLE \`semifinished_product\` ADD \`weight_formula\` varchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`semifinished_product\`
        ADD CONSTRAINT \`FK_e73d328c7afd7a53a5b3675ab64\` FOREIGN KEY (\`restaurant_id\`) REFERENCES \`restaurant\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`semifinished_product\`
        ADD CONSTRAINT \`FK_d15d1689f8954594bc8d128a110\` FOREIGN KEY (\`product_id\`) REFERENCES \`product\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`semifinished_product\`
        DROP FOREIGN KEY \`FK_d15d1689f8954594bc8d128a110\``);
    await queryRunner.query(`ALTER TABLE \`semifinished_product\`
        DROP FOREIGN KEY \`FK_e73d328c7afd7a53a5b3675ab64\``);
    await queryRunner.query(`ALTER TABLE \`semifinished_product\` DROP COLUMN \`weight_formula\``);
    await queryRunner.query(`DROP INDEX \`IDX_e73d328c7afd7a53a5b3675ab6\` ON \`semifinished_product\``);
    await queryRunner.query(`DROP TABLE \`semifinished_product\``);
  }

}
