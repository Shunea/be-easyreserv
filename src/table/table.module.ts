import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableService } from './services/table.service';
import { TableController } from './controllers/table.controller';
import { Table } from './entities/table.entity';
import { Space } from '@src/place/entities/space.entity';
import { Reservation } from '@src/reservation/entities/reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Table, Space, Reservation])],
  exports: [TableService],
  controllers: [TableController],
  providers: [TableService],
})
export class TableModule {}
