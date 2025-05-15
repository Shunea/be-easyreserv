import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refreshToken.entity';
import { RefreshTokenService } from './services/refreshToken.service';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshToken])],
  exports: [RefreshTokenService],
  controllers: [],
  providers: [RefreshTokenService],
})
export class RefreshTokenModule {}
