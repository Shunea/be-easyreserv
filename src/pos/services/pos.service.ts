import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pos } from '@src/pos/entities/pos.entity';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreatePosDto } from '@src/pos/dto/createPos.dto';
import { plainToClass } from 'class-transformer';
import { ERROR_MESSAGES } from '@src/constants';
import { UpdatePosDto } from '@src/pos/dto/updatePos.dto';
import { User } from '@src/user/entities/user.entity';
import { Place } from '@src/place/entities/place.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
@Injectable()
export class PosService {
    private alias = 'pos';
    constructor(@InjectRepository(Pos)
                private readonly posRepository: Repository<Pos>,
                @InjectRepository(User)
                private readonly userRepository: Repository<User>,
                @InjectRepository(Place)
                private readonly placeRepository: Repository<Place>,
                @InjectRepository(Restaurant)
                private readonly restaurantRepository: Repository<Restaurant>,
    ) {
    }
    async create(user: AuthUser,
                 createPosDto: CreatePosDto,
    ): Promise<Pos> {

        const pos = plainToClass(Pos, createPosDto);
        const existingUser = await this.userRepository.findOne({
            where: { id: user.id },
        });
        if (!existingUser) {
            throw new HttpException(
                ERROR_MESSAGES.userNotFound,
                HttpStatus.NOT_FOUND,
            );
        }

        const place = await this.placeRepository.findOne({
            where: { id: user.placeId },
        });
        if (!place) {
            throw new HttpException(
                ERROR_MESSAGES.placeNotFound,
                HttpStatus.NOT_FOUND,
            );
        }

        const restaurant = await this.restaurantRepository.findOne({
            where: { id: user.restaurantId },
        });
        if (!restaurant) {
            throw new HttpException(
                ERROR_MESSAGES.restaurantNotFound,
                HttpStatus.NOT_FOUND,
            );
        }

        pos.placeId = place.id;
        pos.restaurantId = restaurant.id;

        try {
            return await this.posRepository.save(pos);
        } catch (error) {
            throw new HttpException(error.message, error.status);
        }
    }

    async getAll(user: AuthUser): Promise<any> {
        const pos_terminals = await this.posRepository
            .createQueryBuilder('pos')
            .leftJoinAndSelect('pos.restaurant', 'restaurant')
            .select(['pos', 'restaurant.name'])
            .where('pos.place_id = :placeId', { placeId: user.placeId })
            .andWhere('pos.deleted_at IS NULL')
            .getMany();

        if (!pos_terminals.length) {
            throw new HttpException(
                ERROR_MESSAGES.posNotFound,
                HttpStatus.NOT_FOUND,
            );
        }

        return pos_terminals.map((pos) => {
            const { restaurant, ...posData } = pos;
            return {
                ...posData,
                restaurantName: restaurant?.name || null,
            };
        });
    }


    async getById(posId: string, user: AuthUser): Promise<any> {
        const pos = await this.posRepository.findOne({
            where: {
                id: posId,
                placeId: user.placeId,
                deletedAt: null,
            },
            relations: ['restaurant'],
        });

        if (!pos) {
            throw new HttpException(
                ERROR_MESSAGES.posNotFound,
                HttpStatus.NOT_FOUND,
            );
        }

        const { restaurant, ...posData } = pos;
        return {
            ...posData,
            restaurantName: restaurant?.name || null,
        };
    }

    async update(
        user: AuthUser,
        posId: string,
        updatePosDto: UpdatePosDto,
    ): Promise<Pos> {
        try {
            const pos = await this.posRepository.findOne({
                where: {
                    id: posId,
                    placeId: user.placeId,
                    deletedAt: null,
                },
            });
            if (!pos) {
                throw new HttpException(
                    ERROR_MESSAGES.posNotFound,
                    HttpStatus.NOT_FOUND,
                );
            }
            await this.posRepository.update(posId, updatePosDto);
            return this.getById(posId, user);
        } catch (error) {
            throw new HttpException(error.message, error.status);
        }
    }

    async delete(posId: string, user: AuthUser) {
        const pos = await this.posRepository.findOne({
            where: {
                id: posId,
                placeId: user.placeId,
                deletedAt: null,
            },
        });
        if (!pos) {
            throw new HttpException(
                ERROR_MESSAGES.posNotFound,
                HttpStatus.NOT_FOUND,
            );
        }
        await this.posRepository.softRemove(pos);
        return { deleted: true };
    }
}