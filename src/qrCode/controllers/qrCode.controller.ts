import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { QRCode } from '../entities/qrCode.entity';
import { QRCodeService } from '../services/qrCode.service';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { ScanQrCodeDto } from '../dto/scanQrCode.dto';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { Schedule } from '@src/user/entities/schedule.entity';

// Add this enum schema for Swagger
enum QRCodeErrorCodes {
  LOCATION_VALIDATION_FAILED = 'QR001',
  ALREADY_CHECKED_IN = 'QR002',
  ALREADY_CHECKED_OUT = 'QR003',
  NO_ACTIVE_SCHEDULE = 'QR004',
  SCHEDULE_UPDATE_FAILED = 'QR005',
  INVALID_DATE_FORMAT = 'QR006',
  QR_GENERATION_FAILED = 'QR007',
  RESTAURANT_NOT_CONFIGURED = 'QR008',
  UNKNOWN_ERROR = 'QR999'
}

// Add this class for Swagger documentation
class QRCodeErrorResponse {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ 
    enum: QRCodeErrorCodes,
    example: 'QR004',
    description: 'Error code indicating the specific type of error'
  })
  code: QRCodeErrorCodes;

  @ApiProperty({ example: 'No active schedule found' })
  message: string;

  @ApiProperty({ 
    example: 'User must be checked in to a schedule before checking out',
    description: 'Detailed explanation of the error'
  })
  details: string;

  @ApiProperty({ example: '2024-12-02T19:11:28.000Z' })
  timestamp: string;
}

@ApiTags('QRCode')
@Controller('qrcode')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class QRController {
  constructor(private readonly qrCodeService: QRCodeService) {}

  @Get('/')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
    StaffRole.GENERAL,
    StaffRole.STAFF_ACCESS_CONTROL
  )
  @Plans(PlanType.PRO)
  async generateQrCode(@CurrentUser() user: AuthUser, @Res() res: any) {
    return await this.qrCodeService.generateQrCode(user, res);
  }

  @Post('/')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
    StaffRole.GENERAL
  )
  @Plans(PlanType.PRO)
  @ApiResponse({
    status: 200,
    description: 'Successfully processed QR code'
  })
  @ApiResponse({
    status: 400,
    description: `Bad Request. Possible error codes:\n
    - QR001: Location validation failed\n
    - QR002: User already checked in\n
    - QR003: Schedule already checked out\n
    - QR004: No active schedule found\n
    - QR005: Schedule update failed\n
    - QR006: Invalid date format\n
    - QR007: QR code generation failed\n
    - QR008: Restaurant location not configured\n
    - QR999: Unknown error`,
    type: QRCodeErrorResponse
  })
  async scanQrCode(
    @CurrentUser() user: AuthUser,
    @Body() scanQrCode: ScanQrCodeDto,
  ): Promise<{ qrCode: QRCode, schedule: Schedule }> {
    return await this.qrCodeService.scanQRCode(user, scanQrCode);
  }
}
