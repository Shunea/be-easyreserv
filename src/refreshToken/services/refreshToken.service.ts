import { ERROR_MESSAGES } from '@src/constants';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from '../entities/refreshToken.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RefreshTokenService {
  private alias = 'refresh_token';

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async create(data: Partial<RefreshToken>): Promise<RefreshToken> {
    try {
      const refreshToken = this.refreshTokenRepository.create(data);
      return await this.refreshTokenRepository.save(refreshToken);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getByUserId(userId: string): Promise<RefreshToken> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { userId, deletedAt: null },
    });

    return refreshToken;
  }

  async getByRefreshToken(refreshToken: string): Promise<RefreshToken> {
    const refreshTokenData = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, deletedAt: null },
    });

    return refreshTokenData;
  }

  async update(
    refreshTokenId: string,
    updateRefreshTokenDto: Partial<RefreshToken>,
  ): Promise<any> {
    try {
      const refreshToken = await this.refreshTokenRepository.findOne({
        where: { id: refreshTokenId, deletedAt: null },
      });

      if (!refreshToken) {
        throw new HttpException(
          ERROR_MESSAGES.refreshTokenNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const updatedRefreshToken = this.refreshTokenRepository.create({
        ...refreshToken,
        ...updateRefreshTokenDto,
      });

      await this.refreshTokenRepository.save(updatedRefreshToken);

      return updatedRefreshToken;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async delete(refreshTokenId: string) {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { id: refreshTokenId, deletedAt: null },
    });

    if (!refreshToken) {
      throw new HttpException(
        ERROR_MESSAGES.refreshTokenNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.refreshTokenRepository.delete({ id: refreshTokenId });

    return { deleted: true };
  }

  async deleteByUserId(userId: string) {
    const refreshTokens = await this.refreshTokenRepository.find({
      where: { userId, deletedAt: null },
    });

    if (refreshTokens.length === 0) {
      return;
    }

    await this.refreshTokenRepository.delete({ userId });

    return { deleted: true };
  }
}
