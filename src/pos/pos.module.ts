import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosController } from '@src/pos/controllers/pos.controller';
import { Pos } from '@src/pos/entities/pos.entity';
import { PosService } from '@src/pos/services/pos.service';
import { User } from '@src/user/entities/user.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { Place } from "@src/place/entities/place.entity";
@Module({
    imports: [TypeOrmModule.forFeature([Pos, User, Restaurant, Place])],
    controllers: [PosController],
    providers: [PosService],
    exports: [PosService],
})
export class PosModule {
}