import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transport } from './entities/transport.entity';
import { User } from '@src/user/entities/user.entity';
import { TransportService } from './services/transport.service';
import { TransportController } from './controllers/transport.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transport, User])],
  exports: [TransportService],
  controllers: [TransportController],
  providers: [TransportService],
})
export class TransportModule {}
