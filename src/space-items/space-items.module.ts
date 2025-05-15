import { Module } from '@nestjs/common';
import { SpaceItemsController } from './controllers/space_items.controller';
import { SpaceItemsService } from './services/space_items.service';
import { SpaceItems } from './entities/space-items.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Space } from '@src/place/entities/space.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SpaceItems, Space])],
  exports: [SpaceItemsService],
  controllers: [SpaceItemsController],
  providers: [SpaceItemsService],
})
export class SpaceItemsModule {}
