import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Res,
  HttpStatus,
  Param,
  Delete,
  Put,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateDocumentDto } from '../dto/createDocument.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { Document } from '../entities/document.entity';
import { DocumentService } from '../services/document.service';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateDocumentDto } from '../dto/updateDocument.dto';

@ApiTags('Document')
@Controller('document')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('/')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async create(
    @Req() request: any,
    @Body() createDocumentDto: CreateDocumentDto,
  ) {
    return await this.documentService.create(createDocumentDto, request);
  }

  @Get('/')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async getAll(
    @CurrentUser() user: AuthUser,
    @Req() request: any,
    @Res() response: any,
  ) {
    const documents = await this.documentService.getAll(
      user,
      request.queryParsed,
    );
    return response.status(HttpStatus.OK).json(documents);
  }

  @Get(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async getById(@Param('id') id: string): Promise<Document> {
    return await this.documentService.getById(id);
  }

  @Get(`/user/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async getByUserId(@Param('id') id: string): Promise<Document[]> {
    return await this.documentService.getByUserId(id);
  }

  @Put(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateDocumentDto,
  ): Promise<Document> {
    return await this.documentService.update(id, body);
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async delete(@Param('id') id: string) {
    return await this.documentService.delete(id);
  }
}
