import prettify from '@src/common/prettify';
import { CreateTokenKeyDto } from '../dto/createTokenKey.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenKey } from '../entities/tokenKey.entity';
import { UpdateTokenKeyDto } from '../dto/updateTokenKey.dto';
import { getPaginated } from '@src/common/pagination';
import { plainToClass } from 'class-transformer';

@Injectable()
export class TokenKeyService {
  private alias = 'token_key';

  constructor(
    @InjectRepository(TokenKey)
    private readonly tokenKeyRepository: Repository<TokenKey>,
  ) {}

  async create(
    createTokenKeyDto: CreateTokenKeyDto,
    request: any,
  ): Promise<TokenKey> {
    const userId = createTokenKeyDto.userId || request.user.id;
    const tokenKey = plainToClass(TokenKey, { ...createTokenKeyDto, userId });

    try {
      const savedTokenKey = await this.tokenKeyRepository.save(tokenKey);
      return savedTokenKey;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getAll(filter: IFilter): Promise<TokenKey[]> {
    try {
      const { limit, skip, all } = filter;
      const columns = ['type'];

      const queryBuilder = this.tokenKeyRepository.createQueryBuilder(
        this.alias,
      );

      queryBuilder.where('token_key.deleted_at IS NULL');

      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);
      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const tokenKeys = await queryBuilder.getMany();

      const countTokenKeys = await queryBuilder.getCount();

      const result = getPaginated({
        data: tokenKeys,
        count: countTokenKeys,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getById(tokenKeyId: string, response: any): Promise<TokenKey> {
    const tokenKey = await this.tokenKeyRepository.findOne({
      where: {
        id: tokenKeyId,
        deletedAt: null,
      },
    });

    if (!tokenKey) {
      throw new HttpException(
        ERROR_MESSAGES.tokenKeyNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return response.status(HttpStatus.OK).json(tokenKey);
  }

  async checkTokenKey(tokenKey: string): Promise<any> {
    if (!tokenKey) {
      throw new HttpException(
        ERROR_MESSAGES.tokenKeyNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const tokenKeyData = await this.tokenKeyRepository.findOne({
      where: {
        token: tokenKey,
        deletedAt: null,
      },
    });

    if (!tokenKeyData || new Date() > new Date(tokenKeyData.expireAt)) {
      return { valid: false };
    }

    return { valid: true };
  }

  async getByTokenKey(tokenKey: string): Promise<TokenKey> {
    const tokenKeyData = await this.tokenKeyRepository.findOne({
      where: {
        token: tokenKey,
        deletedAt: null,
      },
    });

    if (!tokenKeyData) {
      throw new HttpException(
        ERROR_MESSAGES.tokenKeyNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return tokenKeyData;
  }

  async update(
    tokenKeyId: string,
    updateTokenKeyDto: UpdateTokenKeyDto,
    response: any,
  ): Promise<any> {
    try {
      const tokenKey = await this.tokenKeyRepository.findOne({
        where: {
          id: tokenKeyId,
          deletedAt: null,
        },
      });

      if (!tokenKey) {
        throw new HttpException(
          ERROR_MESSAGES.tokenKeyNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const updatedTokenKey = this.tokenKeyRepository.create({
        ...tokenKey,
        ...updateTokenKeyDto,
      });

      await this.tokenKeyRepository.save(updatedTokenKey);

      return response.status(HttpStatus.OK).json(updatedTokenKey);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async deleteAllByUserId(userId: string) {
    const tokenKeys = await this.tokenKeyRepository.find({
      where: { userId, deletedAt: null },
    });

    if (tokenKeys.length === 0) {
      return;
    }

    await this.tokenKeyRepository.delete({ userId });

    return { deleted: true };
  }

  async delete(tokenKeyId: string) {
    const tokenKey = await this.tokenKeyRepository.findOne({
      where: {
        id: tokenKeyId,
        deletedAt: null,
      },
    });

    if (!tokenKey) {
      throw new HttpException(
        ERROR_MESSAGES.tokenKeyNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.tokenKeyRepository.delete({ id: tokenKeyId });

    return { deleted: true };
  }
}
