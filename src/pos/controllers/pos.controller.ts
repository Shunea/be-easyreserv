import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { PosService } from '@src/pos/services/pos.service';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { Role } from '@src/user/enums/roles.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { PlanType } from '@src/plan/enum/planType.enum';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreatePosDto } from '@src/pos/dto/createPos.dto';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Pos } from '@src/pos/entities/pos.entity';
import { UpdatePosDto } from '@src/pos/dto/updatePos.dto';

@ApiTags('Pos')
@ApiBearerAuth()
@Controller('pos')
export class PosController {
    constructor(private posService: PosService) {
    }
    @Post('/')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
    async createPos(
        @CurrentUser() user: AuthUser,
        @Body() body: CreatePosDto,
    ): Promise<Pos> {
        return await this.posService.create(user, body);
    }

    @ApiBearerAuth()
    @Get('/')
    async getAll(@CurrentUser() user: AuthUser,
                 @Req() request: any,
                 @Res() response: any): Promise<Pos> {
        const posTerminals = await this.posService.getAll(
            user);
        return response.status(HttpStatus.OK).json(posTerminals);
    }

    @Get(`/:id(${REGEX_UUID_VALIDATION})`)
    async getById(@CurrentUser() user: AuthUser,
                  @Res() response: any,
                  @Param('id') id: string,
    ): Promise<Pos> {
        const pos = await this.posService.getById(id, user);
        return response.status(HttpStatus.OK).json(pos);
    }

    @Put(`/:posId(${REGEX_UUID_VALIDATION})`)
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
    async update(
        @CurrentUser() user: AuthUser,
        @Param('posId') posId: string,
        @Body() body: UpdatePosDto,
    ): Promise<Pos> {
        return await this.posService.update(
            user,
            posId,
            body,
        );
    }

    @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
    @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
    @ApiBearerAuth()
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
    async delete(
                @CurrentUser() user: AuthUser,
                @Param('id') id: string
    ) {
        return await this.posService.delete(id, user);
    }
}