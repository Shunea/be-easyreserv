import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@src/auth/guards/roles.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { Role } from '../enums/roles.enum';
import { WaiterCodeService } from '../services/waiter-code.service';
import { WaiterCodeDto } from '../dto/waiter-code.dto';
import { User } from '../entities/user.entity';
import { StaffRole } from '../enums/staff.roles.enum';

@ApiTags('Waiter Code')
@Controller('waiter-code')
export class WaiterCodeController {
  constructor(private readonly waiterCodeService: WaiterCodeService) {}

  @Post('regenerate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(StaffRole.WAITER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate own waiter code' })
  async regenerateOwnCode(@Request() req): Promise<{ code: string }> {
    const code = await this.waiterCodeService.generateNewCodeForWaiter(req.user.id);
    return { code };
  }

  @Post('regenerate/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate new waiter code for a specific user (Admin only)' })
  async generateCode(@Param('userId') userId: string): Promise<{ code: string }> {
    const code = await this.waiterCodeService.generateNewCodeForWaiter(userId);
    return { code };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate waiter code and get user info' })
  async validateCode(@Body() waiterCodeDto: WaiterCodeDto): Promise<User> {
    return await this.waiterCodeService.findUserByWaiterCode(waiterCodeDto.code);
  }

  @Get('missing-codes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of waiters without codes' })
  async getWaitersWithoutCodes(): Promise<User[]> {
    return await this.waiterCodeService.findWaitersWithoutCodes();
  }

  @Post('generate-missing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate codes for all waiters without codes' })
  async generateMissingCodes(): Promise<{ generated: number }> {
    const count = await this.waiterCodeService.generateMissingCodes();
    return { generated: count };
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidate waiter code' })
  async invalidateCode(@Param('userId') userId: string): Promise<void> {
    await this.waiterCodeService.invalidateWaiterCode(userId);
  }
} 