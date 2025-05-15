import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1708005128571 implements MigrationInterface {
  name = 'DB1708005128571';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`ingredient\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`product_ingredient\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`quantity\` int NOT NULL, \`product_id\` varchar(255) NULL, \`ingredient_id\` varchar(255) NOT NULL, INDEX \`IDX_a7a4b2de441d2ab00df5b0d4cd\` (\`product_id\`), INDEX \`IDX_3f9b3e7181dc8cd771e6d513b7\` (\`ingredient_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`place\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`place_type\` enum ('RESTAURANT', 'BEAUTY_SALON', 'CAR_WASH') NOT NULL, \`user_id\` varchar(255) NOT NULL, INDEX \`IDX_f932bcc7e17e3673cf5da5d828\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`space_items\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`item_type\` enum ('PLAYGROUND', 'RECEPTION_BAR', 'BATHROOM', 'STAIRS_UP', 'STAIRS_DOWN', 'EXIT_VERTICAL', 'EXIT_HORIZONTAL', 'WINDOW_VERTICAL', 'WINDOW_HORIZONTAL', 'NO_ITEM') NOT NULL DEFAULT 'NO_ITEM', \`x_coordinates\` int NOT NULL, \`y_coordinates\` int NOT NULL, \`space_id\` varchar(255) NOT NULL, INDEX \`IDX_6a463fc59201055859a3a3bddf\` (\`space_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`order\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` varchar(255) NOT NULL, \`quantity\` int NOT NULL, \`product_id\` varchar(255) NOT NULL, \`price\` decimal(10,2) NOT NULL DEFAULT '0.00', \`is_preorder\` tinyint NOT NULL DEFAULT 1, \`reservation_id\` varchar(255) NOT NULL, INDEX \`IDX_539ede39e518562dfdadfddb49\` (\`product_id\`), INDEX \`IDX_07507b525e84d3e3498211ae4c\` (\`reservation_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`purpose\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`start_time\` time NULL, \`end_time\` time NULL, \`status\` enum ('APPROVED', 'DECLINED', 'WAITING') NOT NULL DEFAULT 'WAITING', \`date\` datetime NOT NULL, \`user_id\` varchar(255) NOT NULL, \`schedule_id\` varchar(255) NOT NULL, INDEX \`IDX_c244b6b821de6db797877ec443\` (\`user_id\`), INDEX \`IDX_5049c3200180f2df0c336eb060\` (\`schedule_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`schedule\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` varchar(255) NULL, \`date\` datetime NOT NULL, \`start_time\` time NULL, \`end_time\` time NULL, \`work_hours\` decimal(12,2) NULL, \`worked_hours\` decimal(12,2) NULL, \`over_work_hours\` decimal(12,2) NULL, \`floor\` varchar(255) NULL, \`status\` enum ('HOLIDAY', 'DAY_OFF', 'WORKING', 'WAITING_INVITE') NOT NULL DEFAULT 'WORKING', \`color\` enum ('BLUE', 'GREEN', 'RED', 'YELLOW', 'GREY', 'ORANGE', 'BLACK') NOT NULL DEFAULT 'GREEN', \`check_status\` tinyint NOT NULL DEFAULT 0, \`user_id\` varchar(255) NOT NULL, INDEX \`IDX_c9927b15da3efbbfb7f2992821\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`vacation\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`start_date\` datetime NULL, \`end_date\` datetime NULL, \`vacation_type\` enum ('SIMPLE_VACATION', 'SICK_VACATION', 'SPECIAL_VACATION') NOT NULL DEFAULT 'SIMPLE_VACATION', \`available_days\` int NULL, \`requested_days\` int NULL, \`status\` enum ('WAITING', 'APPROVED', 'DECLINED', 'IN_PROGRESS', 'PENDING', 'ENDED') NOT NULL DEFAULT 'WAITING', \`key\` varchar(255) NULL, \`vacation_identifier\` varchar(255) NULL, \`user_id\` varchar(255) NOT NULL, INDEX \`IDX_5b5790aa38298868a9792b8bd0\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`document\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`key\` varchar(255) NOT NULL, \`type\` varchar(255) NOT NULL, \`number\` varchar(255) NOT NULL, \`document_name\` varchar(255) NULL, \`expire_on\` datetime NULL, \`issued_on\` datetime NULL, \`item_id\` varchar(255) NULL, \`user_id\` varchar(255) NOT NULL, INDEX \`IDX_704041a979987ef1ee6e493b99\` (\`item_id\`), INDEX \`IDX_a24176a40152f41c98c09d8057\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`token_key\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`token\` varchar(255) NOT NULL, \`expire_at\` datetime NOT NULL, \`user_id\` varchar(255) NOT NULL, INDEX \`IDX_8ed9db7ced442838c0dd04f376\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`refresh_token\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`token\` text NOT NULL, \`expire_at\` datetime NOT NULL, \`user_id\` varchar(255) NOT NULL, INDEX \`IDX_6bbe63d2fe75e7f0ba1710351d\` (\`user_id\`), UNIQUE INDEX \`REL_6bbe63d2fe75e7f0ba1710351d\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`qr_code\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`restaurant_id\` varchar(255) NULL, \`status\` enum ('CHECKIN', 'CHECKOUT', 'PENDING') NULL, \`date\` datetime NOT NULL, \`schedule_id\` varchar(255) NOT NULL, \`user_id\` varchar(255) NOT NULL, INDEX \`IDX_8dde58bd8cd4c71e8cc287cf74\` (\`restaurant_id\`), INDEX \`IDX_3cba5b3150c1fe52126914be56\` (\`schedule_id\`), INDEX \`IDX_99ca60319222ab0447da93f66a\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`plan\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(255) NOT NULL, \`price\` decimal(10,2) NOT NULL DEFAULT '0.00', \`type\` enum ('BASIC', 'STANDARD', 'PRO') NOT NULL DEFAULT 'BASIC', \`billing_period\` enum ('MONTHLY', 'ANNUALLY') NOT NULL DEFAULT 'MONTHLY', \`place_type\` enum ('RESTAURANT', 'BEAUTY_SALON', 'CAR_WASH') NOT NULL DEFAULT 'RESTAURANT', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`plan_history\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`billing_date\` datetime NULL, \`next_billing_date\` datetime NULL, \`is_active\` tinyint NOT NULL DEFAULT 0, \`is_paid\` tinyint NOT NULL DEFAULT 0, \`is_trial_period\` tinyint NOT NULL DEFAULT 1, \`start_trial_period\` datetime NULL, \`end_trial_period\` datetime NULL, \`plan_id\` varchar(255) NOT NULL DEFAULT 1, \`user_id\` varchar(255) NOT NULL, \`restaurant_id\` varchar(255) NULL, INDEX \`IDX_fd6c57b512f971e5c2694d79b0\` (\`plan_id\`), INDEX \`IDX_df08b7fe5b32edc37c81033a98\` (\`user_id\`), INDEX \`IDX_a5b32c9877c802327e605ed0c1\` (\`restaurant_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`favorite\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`user_id\` varchar(255) NOT NULL, \`restaurant_id\` varchar(255) NULL, INDEX \`IDX_e666fc7cc4c80fba1944daa1a7\` (\`user_id\`), INDEX \`IDX_f810ccea26d870ba45aec533a3\` (\`restaurant_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`notification\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` varchar(255) NULL, \`body\` text NULL, \`notification_token_id\` varchar(255) NOT NULL, INDEX \`IDX_237682e95d076d5941c4a76bb2\` (\`notification_token_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`notification_token\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`device_type\` varchar(255) NOT NULL, \`device_token\` varchar(255) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`status\` enum ('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE', INDEX \`IDX_9946abba87be50041606b8c564\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`avatar\` varchar(255) NULL, \`username\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`date_of_birth\` varchar(255) NULL, \`gender\` enum ('Male', 'Female', 'Other') NOT NULL DEFAULT 'Other', \`phone_number\` varchar(255) NULL, \`password\` varchar(255) NOT NULL, \`created_by\` varchar(255) NULL, \`restaurant_id\` varchar(255) NULL, \`place_id\` varchar(255) NULL, \`is_verified\` tinyint NOT NULL DEFAULT 0, \`role\` enum ('SUPER_ADMIN', 'ADMIN', 'USER', 'WAITER', 'CHEF', 'HOSTESS', 'OPERATOR', 'SPECIALIST') NOT NULL DEFAULT 'USER', \`salary\` int NULL, \`is_vip\` tinyint NOT NULL DEFAULT 0, \`language\` enum ('en', 'ro') NOT NULL DEFAULT 'en', INDEX \`IDX_3598cdaa1f61154ba8143c1f32\` (\`restaurant_id\`), INDEX \`IDX_6dc3f42916ea5f37720422d3cd\` (\`place_id\`), UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), UNIQUE INDEX \`IDX_01eea41349b6c9275aec646eee\` (\`phone_number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`review\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`message\` text NULL, \`food_rating\` int NULL, \`service_rating\` int NULL, \`price_rating\` int NULL, \`ambience_rating\` int NULL, \`behavior_rating\` int NULL, \`communication_rating\` int NULL, \`punctuality_rating\` int NULL, \`generosity_rating\` int NULL, \`user_id\` varchar(255) NOT NULL, \`restaurant_id\` varchar(255) NULL, \`reservation_id\` varchar(255) NULL, \`is_staff_review\` tinyint NOT NULL DEFAULT 0, \`is_client_review\` tinyint NOT NULL DEFAULT 0, INDEX \`IDX_81446f2ee100305f42645d4d6c\` (\`user_id\`), INDEX \`IDX_9e0a456057cd16f910bfad306a\` (\`restaurant_id\`), INDEX \`IDX_c038da232564540d81bfde415a\` (\`reservation_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`reservation\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`date\` datetime NOT NULL, \`start_time\` datetime NOT NULL, \`end_time\` datetime NOT NULL, \`status\` enum ('CANCELLED', 'CLOSED', 'CONFIRMED', 'CONFIRMED_PREORDER', 'DISHONORED', 'PENDING', 'PENDING_PREORDER', 'REJECTED', 'SERVE') NOT NULL DEFAULT 'PENDING', \`guests_number\` int NOT NULL, \`table_id\` varchar(255) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`waiter_id\` varchar(255) NULL, \`restaurant_id\` varchar(255) NULL, \`number\` int NOT NULL DEFAULT '0', \`reason\` varchar(255) NULL, \`bonus_type\` enum ('NO_BONUS', 'SINGLE', 'COMMON') NOT NULL DEFAULT 'NO_BONUS', INDEX \`IDX_d3321fc44e70fd7e803491513d\` (\`table_id\`), INDEX \`IDX_e219b0a4ff01b85072bfadf3fd\` (\`user_id\`), INDEX \`IDX_1144fa9b57069a74d1ff1d53ce\` (\`waiter_id\`), INDEX \`IDX_b8e66a59e3500c7a85cde4fb02\` (\`restaurant_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`table\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`table_name\` varchar(255) NOT NULL, \`seats\` int NOT NULL, \`shape\` enum ('SMALL_SQUARE', 'SMALL_ROUND', 'BIG_SQUARE', 'BIG_ROUND', 'RECTANGLE', 'SQUARE', 'ROUND', 'SMALL') NOT NULL DEFAULT 'SMALL_SQUARE', \`x_coordinates\` int NOT NULL, \`y_coordinates\` int NOT NULL, \`space_id\` varchar(255) NOT NULL, INDEX \`IDX_570108e755f1684fc338bdaaf4\` (\`space_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`space\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(255) NOT NULL, \`duration\` int NOT NULL, \`height\` int NULL, \`width\` int NULL, \`restaurant_id\` varchar(255) NOT NULL, INDEX \`IDX_3f832e4ae2d71af45cb697d062\` (\`restaurant_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`restaurant\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`phone_number\` varchar(255) NOT NULL, \`image\` varchar(255) NULL, \`image_galery\` varchar(255) NULL, \`cuisine_type\` enum ('AFRICAN_CUISINE', 'AMERICAN_CUISINE', 'ASIAN_CUISINE', 'AUSTRALIAN_CUISINE', 'BRAZILIAN_CUISINE', 'CARIBBEAN_CUISINE', 'CATERING', 'CHINESE_CUISINE', 'COFFEE', 'EUROPEAN_CUISINE', 'FRENCH_CUISINE', 'GREEK_CUISINE', 'INDIAN_CUISINE', 'ITALIAN_CUISINE', 'JAPANESE_CUISINE', 'KOREAN_CUISINE', 'MEDITERRANEAN_CUISINE', 'MEXICAN_CUISINE', 'SPANISH_CUISINE', 'THAI_CUISINE', 'VIETNAMESE_CUISINE', 'MIDDLE_EASTERN_CUISINE', 'RUSSIAN_CUISINE', 'TURKISH_CUISINE', 'CAJUN_CUISINE', 'PERUVIAN_CUISINE', 'SCANDINAVIAN_CUISINE', 'TEX_MEX_CUISINE', 'FUSION_CUISINE', 'VEGETARIAN_CUISINE', 'VEGAN_CUISINE', 'SEAFOOD_CUISINE', 'FAST_FOOD', 'DESSERTS_PASTRIES', 'BEVERAGES', 'SUSHI', 'DIM_SUM', 'BBQ', 'ETHIOPIAN_CUISINE', 'IRISH_CUISINE', 'JAMAICAN_CUISINE', 'MOROCCAN_CUISINE', 'POLISH_CUISINE', 'SWISS_CUISINE', 'MIXED_CUISINE') NOT NULL DEFAULT 'EUROPEAN_CUISINE', \`work_schedule\` json NOT NULL, \`latitude\` double NULL, \`longitude\` double NULL, \`address\` varchar(255) NULL, \`sector\` varchar(255) NULL, \`city\` varchar(255) NULL, \`place_id\` varchar(255) NOT NULL, INDEX \`IDX_2ec0e43b8552a729fa87fa7a4b\` (\`place_id\`), UNIQUE INDEX \`IDX_d055cac5f0f06d57b0a3b1fe57\` (\`email\`), UNIQUE INDEX \`IDX_f5718b24886dfaa270caf66ca7\` (\`phone_number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`product\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` varchar(255) NOT NULL, \`price\` decimal(10,2) NOT NULL DEFAULT '0.00', \`weight\` int NULL, \`image\` varchar(255) NULL, \`category_id\` varchar(255) NOT NULL, \`restaurant_id\` varchar(255) NOT NULL, INDEX \`IDX_0dce9bc93c2d2c399982d04bef\` (\`category_id\`), INDEX \`IDX_71aea1d530c0b4920a8ca0e6a2\` (\`restaurant_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`category\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`communication_types\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`type\` varchar(255) NOT NULL, \`restaurant_id\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`communication\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`title\` text NOT NULL, \`message\` text NOT NULL, \`start_date\` datetime NOT NULL, \`end_date\` datetime NOT NULL, \`discount\` int NULL, \`restaurant_id\` varchar(255) NOT NULL, \`communication_type_id\` varchar(255) NOT NULL, \`send_message_date\` datetime NOT NULL, INDEX \`IDX_5d5865d3acdb2d03f2b04d9183\` (\`restaurant_id\`), INDEX \`IDX_2dc4bba08b5b572029bb35608c\` (\`communication_type_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`job_entity\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`job_id\` varchar(255) NOT NULL, \`message_id\` varchar(255) NOT NULL, INDEX \`IDX_72ec97aa2d0a05ac8eedb51bc4\` (\`job_id\`), INDEX \`IDX_360c1391292e2b07b2101a4676\` (\`message_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`stock\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`restaurant_id\` varchar(255) NOT NULL, \`title\` varchar(255) NOT NULL, \`category\` enum ('NO_CATEGORY', 'GROCERS', 'PANIFICATION', 'MEAT', 'FRUITS', 'VEGETABLES', 'SEAFOOD', 'DAIRY_PRODUCTS', 'CEREALS', 'REFRESHMENTS', 'ALCOHOLIC_BEVERAGES', 'COFFEE_AND_TEA', 'JUICE', 'CLEANING_PRODUCTS', 'PAPER_TOWELS', 'DISINFECTANTS', 'PROTECTIVE_GLOVES', 'PACKAGING_FOR_DELIVERY', 'DISPOSABLE_TABLEWARE', 'CUTLERY_AND_PLATES', 'TOOTHPICKS') NOT NULL DEFAULT 'NO_CATEGORY', \`expiration_date\` datetime NOT NULL, \`volume\` decimal(7,2) NOT NULL, \`pc_volume\` int NULL, \`pc_unit\` enum ('kg', 'gr', 'pcs', 'l', 'ml') NOT NULL DEFAULT 'gr', \`unit\` enum ('kg', 'gr', 'pcs', 'l', 'ml') NOT NULL DEFAULT 'kg', \`reorder_limit\` int NOT NULL, \`tva_percent\` enum ('8', '12', '20') NULL, \`stock_status\` enum ('Out-of-stock', 'Low stock', 'Near-low stock', 'Sufficient') NOT NULL DEFAULT 'Sufficient', \`price_wout_tva\` int NOT NULL, \`price_with_tva\` int NULL, \`payment_method\` enum ('CASH', 'TRANSFER') NOT NULL DEFAULT 'CASH', \`invoice_number\` varchar(255) NOT NULL, \`suplier_id\` varchar(255) NOT NULL, \`suplier_name\` varchar(255) NOT NULL, INDEX \`IDX_a6af2b7c1ab2e6770cf47f6c80\` (\`restaurant_id\`), INDEX \`IDX_31f94242ab0597b51f7663701e\` (\`suplier_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`suplier\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(255) NOT NULL, \`phone_number\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`idno\` varchar(13) NOT NULL, \`vat_number\` varchar(255) NULL, \`iban\` varchar(255) NOT NULL, \`bank_name\` varchar(255) NOT NULL, \`image\` varchar(255) NULL, \`last_order\` datetime NULL, \`order_volume\` int NULL, \`restaurant_id\` varchar(255) NOT NULL, \`telegram_username\` varchar(255) NULL, \`telegram_id\` varchar(255) NULL, INDEX \`IDX_b837eaa7850d155186f10fb479\` (\`restaurant_id\`), INDEX \`IDX_bffe31b3e2fdb3fb94167364c6\` (\`telegram_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`reservation_table\` (\`reservation_id\` varchar(36) NOT NULL, \`table_id\` varchar(36) NOT NULL, INDEX \`IDX_60a89d4a03b474dbd918b317b8\` (\`reservation_id\`), INDEX \`IDX_a8c8e6608e72192eb726d84dd3\` (\`table_id\`), PRIMARY KEY (\`reservation_id\`, \`table_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`product_ingredient\` ADD CONSTRAINT \`FK_a7a4b2de441d2ab00df5b0d4cdd\` FOREIGN KEY (\`product_id\`) REFERENCES \`product\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`product_ingredient\` ADD CONSTRAINT \`FK_3f9b3e7181dc8cd771e6d513b7b\` FOREIGN KEY (\`ingredient_id\`) REFERENCES \`ingredient\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`space_items\` ADD CONSTRAINT \`FK_6a463fc59201055859a3a3bddf5\` FOREIGN KEY (\`space_id\`) REFERENCES \`space\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD CONSTRAINT \`FK_07507b525e84d3e3498211ae4c6\` FOREIGN KEY (\`reservation_id\`) REFERENCES \`reservation\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD CONSTRAINT \`FK_539ede39e518562dfdadfddb492\` FOREIGN KEY (\`product_id\`) REFERENCES \`product\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purpose\` ADD CONSTRAINT \`FK_c244b6b821de6db797877ec4437\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purpose\` ADD CONSTRAINT \`FK_5049c3200180f2df0c336eb0606\` FOREIGN KEY (\`schedule_id\`) REFERENCES \`schedule\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`schedule\` ADD CONSTRAINT \`FK_c9927b15da3efbbfb7f29928216\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`vacation\` ADD CONSTRAINT \`FK_5b5790aa38298868a9792b8bd07\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`document\` ADD CONSTRAINT \`FK_a24176a40152f41c98c09d8057d\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`token_key\` ADD CONSTRAINT \`FK_8ed9db7ced442838c0dd04f3761\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_token\` ADD CONSTRAINT \`FK_6bbe63d2fe75e7f0ba1710351d4\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`qr_code\` ADD CONSTRAINT \`FK_99ca60319222ab0447da93f66a7\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`plan_history\` ADD CONSTRAINT \`FK_df08b7fe5b32edc37c81033a98f\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`plan_history\` ADD CONSTRAINT \`FK_fd6c57b512f971e5c2694d79b07\` FOREIGN KEY (\`plan_id\`) REFERENCES \`plan\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`plan_history\` ADD CONSTRAINT \`FK_a5b32c9877c802327e605ed0c14\` FOREIGN KEY (\`restaurant_id\`) REFERENCES \`restaurant\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`favorite\` ADD CONSTRAINT \`FK_e666fc7cc4c80fba1944daa1a74\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`favorite\` ADD CONSTRAINT \`FK_f810ccea26d870ba45aec533a34\` FOREIGN KEY (\`restaurant_id\`) REFERENCES \`restaurant\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` ADD CONSTRAINT \`FK_237682e95d076d5941c4a76bb27\` FOREIGN KEY (\`notification_token_id\`) REFERENCES \`notification_token\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification_token\` ADD CONSTRAINT \`FK_9946abba87be50041606b8c5646\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` ADD CONSTRAINT \`FK_81446f2ee100305f42645d4d6c2\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` ADD CONSTRAINT \`FK_9e0a456057cd16f910bfad306ad\` FOREIGN KEY (\`restaurant_id\`) REFERENCES \`restaurant\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` ADD CONSTRAINT \`FK_c038da232564540d81bfde415ab\` FOREIGN KEY (\`reservation_id\`) REFERENCES \`reservation\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` ADD CONSTRAINT \`FK_b8e66a59e3500c7a85cde4fb020\` FOREIGN KEY (\`restaurant_id\`) REFERENCES \`restaurant\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` ADD CONSTRAINT \`FK_e219b0a4ff01b85072bfadf3fd7\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` ADD CONSTRAINT \`FK_1144fa9b57069a74d1ff1d53ce7\` FOREIGN KEY (\`waiter_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`table\` ADD CONSTRAINT \`FK_570108e755f1684fc338bdaaf4d\` FOREIGN KEY (\`space_id\`) REFERENCES \`space\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`space\` ADD CONSTRAINT \`FK_3f832e4ae2d71af45cb697d0621\` FOREIGN KEY (\`restaurant_id\`) REFERENCES \`restaurant\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`restaurant\` ADD CONSTRAINT \`FK_2ec0e43b8552a729fa87fa7a4b4\` FOREIGN KEY (\`place_id\`) REFERENCES \`place\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD CONSTRAINT \`FK_0dce9bc93c2d2c399982d04bef1\` FOREIGN KEY (\`category_id\`) REFERENCES \`category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD CONSTRAINT \`FK_71aea1d530c0b4920a8ca0e6a23\` FOREIGN KEY (\`restaurant_id\`) REFERENCES \`restaurant\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`communication\` ADD CONSTRAINT \`FK_2dc4bba08b5b572029bb35608c5\` FOREIGN KEY (\`communication_type_id\`) REFERENCES \`communication_types\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation_table\` ADD CONSTRAINT \`FK_60a89d4a03b474dbd918b317b8b\` FOREIGN KEY (\`reservation_id\`) REFERENCES \`reservation\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation_table\` ADD CONSTRAINT \`FK_a8c8e6608e72192eb726d84dd30\` FOREIGN KEY (\`table_id\`) REFERENCES \`table\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`reservation_table\` DROP FOREIGN KEY \`FK_a8c8e6608e72192eb726d84dd30\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation_table\` DROP FOREIGN KEY \`FK_60a89d4a03b474dbd918b317b8b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`communication\` DROP FOREIGN KEY \`FK_2dc4bba08b5b572029bb35608c5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`product\` DROP FOREIGN KEY \`FK_71aea1d530c0b4920a8ca0e6a23\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`product\` DROP FOREIGN KEY \`FK_0dce9bc93c2d2c399982d04bef1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`restaurant\` DROP FOREIGN KEY \`FK_2ec0e43b8552a729fa87fa7a4b4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`space\` DROP FOREIGN KEY \`FK_3f832e4ae2d71af45cb697d0621\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`table\` DROP FOREIGN KEY \`FK_570108e755f1684fc338bdaaf4d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` DROP FOREIGN KEY \`FK_1144fa9b57069a74d1ff1d53ce7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` DROP FOREIGN KEY \`FK_e219b0a4ff01b85072bfadf3fd7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` DROP FOREIGN KEY \`FK_b8e66a59e3500c7a85cde4fb020\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` DROP FOREIGN KEY \`FK_c038da232564540d81bfde415ab\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` DROP FOREIGN KEY \`FK_9e0a456057cd16f910bfad306ad\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` DROP FOREIGN KEY \`FK_81446f2ee100305f42645d4d6c2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification_token\` DROP FOREIGN KEY \`FK_9946abba87be50041606b8c5646\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` DROP FOREIGN KEY \`FK_237682e95d076d5941c4a76bb27\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`favorite\` DROP FOREIGN KEY \`FK_f810ccea26d870ba45aec533a34\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`favorite\` DROP FOREIGN KEY \`FK_e666fc7cc4c80fba1944daa1a74\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`plan_history\` DROP FOREIGN KEY \`FK_a5b32c9877c802327e605ed0c14\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`plan_history\` DROP FOREIGN KEY \`FK_fd6c57b512f971e5c2694d79b07\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`plan_history\` DROP FOREIGN KEY \`FK_df08b7fe5b32edc37c81033a98f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`qr_code\` DROP FOREIGN KEY \`FK_99ca60319222ab0447da93f66a7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_token\` DROP FOREIGN KEY \`FK_6bbe63d2fe75e7f0ba1710351d4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`token_key\` DROP FOREIGN KEY \`FK_8ed9db7ced442838c0dd04f3761\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`document\` DROP FOREIGN KEY \`FK_a24176a40152f41c98c09d8057d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`vacation\` DROP FOREIGN KEY \`FK_5b5790aa38298868a9792b8bd07\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`schedule\` DROP FOREIGN KEY \`FK_c9927b15da3efbbfb7f29928216\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purpose\` DROP FOREIGN KEY \`FK_5049c3200180f2df0c336eb0606\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purpose\` DROP FOREIGN KEY \`FK_c244b6b821de6db797877ec4437\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` DROP FOREIGN KEY \`FK_539ede39e518562dfdadfddb492\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` DROP FOREIGN KEY \`FK_07507b525e84d3e3498211ae4c6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`space_items\` DROP FOREIGN KEY \`FK_6a463fc59201055859a3a3bddf5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`product_ingredient\` DROP FOREIGN KEY \`FK_3f9b3e7181dc8cd771e6d513b7b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`product_ingredient\` DROP FOREIGN KEY \`FK_a7a4b2de441d2ab00df5b0d4cdd\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a8c8e6608e72192eb726d84dd3\` ON \`reservation_table\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_60a89d4a03b474dbd918b317b8\` ON \`reservation_table\``,
    );
    await queryRunner.query(`DROP TABLE \`reservation_table\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_bffe31b3e2fdb3fb94167364c6\` ON \`suplier\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_b837eaa7850d155186f10fb479\` ON \`suplier\``,
    );
    await queryRunner.query(`DROP TABLE \`suplier\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_31f94242ab0597b51f7663701e\` ON \`stock\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a6af2b7c1ab2e6770cf47f6c80\` ON \`stock\``,
    );
    await queryRunner.query(`DROP TABLE \`stock\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_360c1391292e2b07b2101a4676\` ON \`job_entity\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_72ec97aa2d0a05ac8eedb51bc4\` ON \`job_entity\``,
    );
    await queryRunner.query(`DROP TABLE \`job_entity\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_2dc4bba08b5b572029bb35608c\` ON \`communication\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_5d5865d3acdb2d03f2b04d9183\` ON \`communication\``,
    );
    await queryRunner.query(`DROP TABLE \`communication\``);
    await queryRunner.query(`DROP TABLE \`communication_types\``);
    await queryRunner.query(`DROP TABLE \`category\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_71aea1d530c0b4920a8ca0e6a2\` ON \`product\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_0dce9bc93c2d2c399982d04bef\` ON \`product\``,
    );
    await queryRunner.query(`DROP TABLE \`product\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_f5718b24886dfaa270caf66ca7\` ON \`restaurant\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_d055cac5f0f06d57b0a3b1fe57\` ON \`restaurant\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_2ec0e43b8552a729fa87fa7a4b\` ON \`restaurant\``,
    );
    await queryRunner.query(`DROP TABLE \`restaurant\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_3f832e4ae2d71af45cb697d062\` ON \`space\``,
    );
    await queryRunner.query(`DROP TABLE \`space\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_570108e755f1684fc338bdaaf4\` ON \`table\``,
    );
    await queryRunner.query(`DROP TABLE \`table\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_b8e66a59e3500c7a85cde4fb02\` ON \`reservation\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_1144fa9b57069a74d1ff1d53ce\` ON \`reservation\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_e219b0a4ff01b85072bfadf3fd\` ON \`reservation\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_d3321fc44e70fd7e803491513d\` ON \`reservation\``,
    );
    await queryRunner.query(`DROP TABLE \`reservation\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_c038da232564540d81bfde415a\` ON \`review\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_9e0a456057cd16f910bfad306a\` ON \`review\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_81446f2ee100305f42645d4d6c\` ON \`review\``,
    );
    await queryRunner.query(`DROP TABLE \`review\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_01eea41349b6c9275aec646eee\` ON \`user\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_6dc3f42916ea5f37720422d3cd\` ON \`user\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_3598cdaa1f61154ba8143c1f32\` ON \`user\``,
    );
    await queryRunner.query(`DROP TABLE \`user\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_9946abba87be50041606b8c564\` ON \`notification_token\``,
    );
    await queryRunner.query(`DROP TABLE \`notification_token\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_237682e95d076d5941c4a76bb2\` ON \`notification\``,
    );
    await queryRunner.query(`DROP TABLE \`notification\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_f810ccea26d870ba45aec533a3\` ON \`favorite\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_e666fc7cc4c80fba1944daa1a7\` ON \`favorite\``,
    );
    await queryRunner.query(`DROP TABLE \`favorite\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_a5b32c9877c802327e605ed0c1\` ON \`plan_history\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_df08b7fe5b32edc37c81033a98\` ON \`plan_history\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_fd6c57b512f971e5c2694d79b0\` ON \`plan_history\``,
    );
    await queryRunner.query(`DROP TABLE \`plan_history\``);
    await queryRunner.query(`DROP TABLE \`plan\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_99ca60319222ab0447da93f66a\` ON \`qr_code\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_3cba5b3150c1fe52126914be56\` ON \`qr_code\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_8dde58bd8cd4c71e8cc287cf74\` ON \`qr_code\``,
    );
    await queryRunner.query(`DROP TABLE \`qr_code\``);
    await queryRunner.query(
      `DROP INDEX \`REL_6bbe63d2fe75e7f0ba1710351d\` ON \`refresh_token\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_6bbe63d2fe75e7f0ba1710351d\` ON \`refresh_token\``,
    );
    await queryRunner.query(`DROP TABLE \`refresh_token\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_8ed9db7ced442838c0dd04f376\` ON \`token_key\``,
    );
    await queryRunner.query(`DROP TABLE \`token_key\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_a24176a40152f41c98c09d8057\` ON \`document\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_704041a979987ef1ee6e493b99\` ON \`document\``,
    );
    await queryRunner.query(`DROP TABLE \`document\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_5b5790aa38298868a9792b8bd0\` ON \`vacation\``,
    );
    await queryRunner.query(`DROP TABLE \`vacation\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_c9927b15da3efbbfb7f2992821\` ON \`schedule\``,
    );
    await queryRunner.query(`DROP TABLE \`schedule\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_5049c3200180f2df0c336eb060\` ON \`purpose\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_c244b6b821de6db797877ec443\` ON \`purpose\``,
    );
    await queryRunner.query(`DROP TABLE \`purpose\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_07507b525e84d3e3498211ae4c\` ON \`order\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_539ede39e518562dfdadfddb49\` ON \`order\``,
    );
    await queryRunner.query(`DROP TABLE \`order\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_6a463fc59201055859a3a3bddf\` ON \`space_items\``,
    );
    await queryRunner.query(`DROP TABLE \`space_items\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_f932bcc7e17e3673cf5da5d828\` ON \`place\``,
    );
    await queryRunner.query(`DROP TABLE \`place\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_3f9b3e7181dc8cd771e6d513b7\` ON \`product_ingredient\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a7a4b2de441d2ab00df5b0d4cd\` ON \`product_ingredient\``,
    );
    await queryRunner.query(`DROP TABLE \`product_ingredient\``);
    await queryRunner.query(`DROP TABLE \`ingredient\``);
  }
}
