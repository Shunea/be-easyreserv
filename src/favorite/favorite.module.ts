import { Favorite } from './entities/favorite.entity';
import { FavoriteController } from './controllers/favorite.controller';
import { FavoriteService } from './services/favorite.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite])],
  exports: [FavoriteService],
  controllers: [FavoriteController],
  providers: [FavoriteService],
})
export class FavoriteModule {}
