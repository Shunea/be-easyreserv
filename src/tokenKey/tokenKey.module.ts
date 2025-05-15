import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenKey } from './entities/tokenKey.entity';
import { TokenKeyController } from './controllers/tokenKey.controller';
import { TokenKeyService } from './services/tokenKey.service';

@Module({
  imports: [TypeOrmModule.forFeature([TokenKey])],
  exports: [TokenKeyService],
  controllers: [TokenKeyController],
  providers: [TokenKeyService],
})
export class TokenKeyModule {}
