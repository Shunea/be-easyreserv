import 'multer';
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AwsS3Service } from '../services/aws-s3.service';
import { ERROR_MESSAGES } from '@src/constants';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('AWS')
@Controller('aws')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class AwsS3Controller {
  constructor(private readonly awsS3Service: AwsS3Service) {}

  @Post('/file/upload')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new HttpException(
        ERROR_MESSAGES.noFileProvided,
        HttpStatus.NOT_FOUND,
      );
    }

    return await this.awsS3Service.uploadFileToS3(file, folder);
  }

  @Get('/file/:key')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getFile(@Param('key') key: string, @Query('folder') folder?: string) {
    if (!key) {
      throw new HttpException(
        ERROR_MESSAGES.noFileKeyProvided,
        HttpStatus.NOT_FOUND,
      );
    }

    return await this.awsS3Service.getFileFromS3(key, folder);
  }
}
