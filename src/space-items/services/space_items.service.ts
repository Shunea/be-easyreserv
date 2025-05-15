import * as dotenv from 'dotenv';
import { CreateSpaceItemDto } from '../dto/create_space-items.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Space } from '@src/place/entities/space.entity';
import { SpaceItems } from '../entities/space-items.entity';
import { UpdateSpaceItemDto } from '../dto/update_space-items.dto';
import { plainToClass } from 'class-transformer';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';

dotenv.config();

@Injectable()
export class SpaceItemsService {
  private alias = 'space_items';

  constructor(
    @InjectRepository(SpaceItems)
    private spaceItemsRepository: Repository<SpaceItems>,

    @InjectRepository(Space)
    private spaceRepository: Repository<Space>,
  ) {}

  async create(createSpaceItemDto: CreateSpaceItemDto, spaceId: string) {
    const spaceItem = plainToClass(SpaceItems, createSpaceItemDto);

    const space = await this.spaceRepository.findOne({
      where: { id: spaceId, deletedAt: null },
    });

    if (!space) {
      throw new HttpException(
        ERROR_MESSAGES.spaceNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    spaceItem.space = space;

    const result = await this.spaceItemsRepository.save(spaceItem);

    return result;
  }

  async getAll(spaceId: string, user: AuthUser) {
    const space = await this.spaceRepository.findOne({
      where: { id: spaceId, restaurantId: user.restaurantId, deletedAt: null },
    });

    if (!space) {
      throw new HttpException(
        ERROR_MESSAGES.spaceNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const spaceItems = await this.spaceItemsRepository.find({
      where: { spaceId: space.id, deletedAt: null },
    });

    return spaceItems;
  }

  async update(id: string, updateSpaceItemDto: UpdateSpaceItemDto) {
    const spaceItem = await this.spaceItemsRepository.findOne({
      where: { id: id, deletedAt: null },
    });

    if (!spaceItem) {
      throw new HttpException(
        ERROR_MESSAGES.spaceItemNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.spaceItemsRepository.update(spaceItem.id, updateSpaceItemDto);

    const result = await this.spaceItemsRepository.findOne({
      where: { id: spaceItem.id, deletedAt: null },
    });

    return result;
  }

  async delete(spaceItemId: string) {
    const spaceItem = await this.spaceItemsRepository.findOne({
      where: {
        id: spaceItemId,
        deletedAt: null,
      },
    });

    if (!spaceItem) {
      throw new HttpException(
        ERROR_MESSAGES.spaceItemNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.spaceItemsRepository.softDelete(spaceItemId);

    return { deleted: true };
  }
}
