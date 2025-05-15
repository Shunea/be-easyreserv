import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../enums/roles.enum';
import { ERROR_MESSAGES } from '@src/constants';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { StaffRole } from '../enums/staff.roles.enum';

@Injectable()
export class WaiterCodeService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private generateWaiterCode(): string {
    return this.padNumber(Math.floor(Math.random() * 1000000));
  }

  private padNumber(num: number): string {
    return num.toString().padStart(6, '0');
  }

  async generateNewCodeForWaiter(userId: string): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId, role: StaffRole.WAITER },
    });

    if (!user) {
      throw new HttpException(
        ERROR_MESSAGES.userNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    // Generate a unique code
    let code: string;
    let isUnique = false;
    while (!isUnique) {
      code = this.generateWaiterCode();
      const existingUser = await this.userRepository.findOne({
        where: { waiterCode: code },
      });
      if (!existingUser) {
        isUnique = true;
      }
    }

    // Update user with new code
    user.waiterCode = code;
    await this.userRepository.save(user);

    return code;
  }

  async findUserByWaiterCode(code: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { waiterCode: code, role: StaffRole.WAITER },
    });

    if (!user) {
      throw new HttpException(
        'Invalid waiter code',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }

  async findWaitersWithoutCodes(): Promise<User[]> {
    return await this.userRepository.find({
      where: {
        role: StaffRole.WAITER,
        waiterCode: null,
      },
    });
  }

  async generateMissingCodes(): Promise<number> {
    const waitersWithoutCodes = await this.findWaitersWithoutCodes();
    let generatedCount = 0;

    for (const waiter of waitersWithoutCodes) {
      await this.generateNewCodeForWaiter(waiter.id);
      generatedCount++;
    }

    return generatedCount;
  }

  async invalidateWaiterCode(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId, role: StaffRole.WAITER },
    });

    if (!user) {
      throw new HttpException(
        ERROR_MESSAGES.userNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    user.waiterCode = null;
    await this.userRepository.save(user);
  }
} 