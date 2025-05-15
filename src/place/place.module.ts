import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '@src/auth/strategies/jwt.strategy';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { Place } from './entities/place.entity';
import { PlaceController } from './controllers/place.controller';
import { PlaceService } from './services/place.service';
import { RefreshToken } from '@src/refreshToken/entities/refreshToken.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { Space } from './entities/space.entity';
import { SpaceController } from './controllers/space.controller';
import { SpaceService } from './services/space.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Place, RefreshToken, Restaurant, Space, User]),
    MulterModule.register({
      dest: './files',
    }),
    JwtModule.register({}),
  ],
  exports: [PlaceService, JwtStrategy],
  controllers: [PlaceController, SpaceController],
  providers: [PlaceService, SpaceService, JwtStrategy],
})
export class PlaceModule {}
