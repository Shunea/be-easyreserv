import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { CreateMessageDto } from '../dto/create-message.dto';
import { CommunicationService } from '../services/communication.service';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { Role } from '@src/user/enums/roles.enum';
import { Communication } from '../entities/communication.entity';
import { UpdateMessageDto } from '../dto/update-message.dto';

@ApiTags('Communication')
@Controller('communication')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class CommunicationController {
  constructor(private communicationService: CommunicationService) {
  }

  @Post('/send_message/:sender/:receiver/:message')
  async sendMessages(@Param('sender_alias') senderAlias: string,
                     @Param('receiver_number') receiverNumber: string,
                     @Param('message') message: string,
  ) {
    return this.communicationService.sendMessages(senderAlias, receiverNumber, message);
  }

  @Post('/')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async createMessage(
    @CurrentUser() user: AuthUser,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return await this.communicationService.create(user, createMessageDto);
  }

  @Get('/')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAll(
    @Req() request: any,
    @Res() response: any,
    @CurrentUser() user: AuthUser,
  ): Promise<Communication[]> {
    const messages = await this.communicationService.getAll(
      user,
      request.queryParsed,
    );

    return response.status(HttpStatus.OK).json(messages);
  }

  @Get('/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getById(@Param('id') messageId: string) {
    return await this.communicationService.getById(messageId);
  }

  @Get('/messages/types')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAllTypes(@CurrentUser() user: AuthUser) {
    return await this.communicationService.getAllMessageTypes(user);
  }

  @Put('/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return await this.communicationService.update(
      user,
      messageId,
      updateMessageDto,
    );
  }

  @Delete('/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async delete(@Param('id') messageId: string) {
    return await this.communicationService.delete(messageId);
  }
}
