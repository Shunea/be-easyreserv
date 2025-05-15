import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Placement } from '@src/placement/entities/placement.entity';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreatePlacementDto } from '@src/placement/dto/create-placement.dto';
import { plainToClass } from 'class-transformer';
import { ERROR_MESSAGES } from '@src/constants';
import { UpdatePlacementDto } from '@src/placement/dto/update-placement.dto';
import { User } from '@src/user/entities/user.entity';
import { Place } from '@src/place/entities/place.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { PlacementDataDto } from '@src/placement/dto/placement-data.dto';

@Injectable()
export class PlacementService {
  private alias = 'placement';

  constructor(
    @InjectRepository(Placement)
    private readonly placementRepository: Repository<Placement>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async create(
    user: AuthUser,
    createPlacementDto: CreatePlacementDto,
  ): Promise<Placement> {
    const existingPlacement = await this.placementRepository.findOne({
      where: {
        titleEn: createPlacementDto.titleEn,
        titleRo: createPlacementDto.titleRo,
        titleRu: createPlacementDto.titleRu,
      },
    });

    if (existingPlacement) {
      throw new HttpException(
        ERROR_MESSAGES.placementAlreadyExists.replace(
          ':title',
          createPlacementDto.titleEn,
        ),
        HttpStatus.BAD_REQUEST,
      );
    }
    const existingUser = await this.userRepository.findOne({
      where: { id: user.id },
    });

    const place = await this.placeRepository.findOneBy({
      id: user.placeId,
      userId: user.id,
      deletedAt: null,
    });

    const restaurants = await this.restaurantRepository.findBy({
      placeId: place.id,
      deletedAt: null,
    });

    const placement = plainToClass(Placement, createPlacementDto);
    placement.userId = user.id;
    placement.user = existingUser;
    placement.place = place;
    placement.restaurants = restaurants;

    try {
      return await this.placementRepository.save(placement);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getAll(user: AuthUser): Promise<any> {
    const placements = await this.placementRepository
      .createQueryBuilder(this.alias)
      .select(['placement'])
      .where('placement.user_id = :userId', { userId: user.id })
      .andWhere('placement.deleted_at IS NULL')
      .getMany();

    if (!placements.length) {
      throw new HttpException(
        ERROR_MESSAGES.placementNotFound,
        HttpStatus.NOT_FOUND,
      );
    }
    const placementsData: PlacementDataDto[] = [];

    for (const placement of placements) {
      const placementData = plainToClass(PlacementDataDto, placement);
      const restaurants = await this.restaurantRepository.findBy({
        placeId: user.placeId,
        deletedAt: null,
      });

      placementData.restaurantsIds = restaurants.map(
        (restaurant) => restaurant.id,
      );
      placementsData.push(placementData);
    }

    return placementsData;
  }

  async getById(placementId: string, user: AuthUser): Promise<any> {
    const existentPlacement = await this.placementRepository.findOne({
      where: {
        id: placementId,
        userId: user.id,
        deletedAt: null,
      },
      relations: ['user'],
    });

    const restaurants = await this.restaurantRepository.findBy({
      placeId: user.placeId,
      deletedAt: null,
    });

    const restaurantsIds = restaurants.map((restaurant) => restaurant.id);
    const placement = plainToClass(PlacementDataDto, existentPlacement);
    placement.restaurantsIds = restaurantsIds;

    if (!placement) {
      throw new HttpException(
        ERROR_MESSAGES.placeNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return placement;
  }

  async update(
    user: AuthUser,
    placementId: string,
    updatePlacementDto: UpdatePlacementDto,
  ): Promise<Placement> {
    try {
      const placement = await this.placementRepository.findOne({
        where: {
          id: placementId,
          deletedAt: null,
        },
      });

      if (!placement) {
        throw new HttpException(
          ERROR_MESSAGES.placementNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      await this.placementRepository.update(placementId, updatePlacementDto);

      return { ...placement, ...updatePlacementDto };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async delete(placementId: string) {
    const placement = await this.placementRepository.findOne({
      where: {
        id: placementId,
        deletedAt: null,
      },
    });

    if (!placement) {
      throw new HttpException(
        ERROR_MESSAGES.placementNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.placementRepository.softRemove(placement);

    return { deleted: true };
  }

  async getImageGallery(placementId: string): Promise<any> {
    try {
      const placement = await this.placementRepository.findOne({
        where: { id: placementId, deletedAt: null },
        select: ['id', 'image'],
      });

      const response = JSON.parse(placement.image);

      return response;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
