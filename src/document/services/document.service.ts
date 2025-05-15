import prettify from '@src/common/prettify';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateDocumentDto } from '../dto/createDocument.dto';
import { Document } from '../entities/document.entity';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateDocumentDto } from '../dto/updateDocument.dto';
import { getPaginated } from '@src/common/pagination';
import { plainToClass } from 'class-transformer';

@Injectable()
export class DocumentService {
  private alias = 'document';

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  async create(
    createDocumentDto: CreateDocumentDto,
    request: any,
  ): Promise<Document> {
    const userId = createDocumentDto.userId || request.user.id;
    const document = plainToClass(Document, { ...createDocumentDto, userId });

    try {
      const savedDocument = await this.documentRepository.save(document);
      return savedDocument;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getAll(user: AuthUser, filter: IFilter): Promise<Document[]> {
    try {
      const { limit, skip, all } = filter;
      const columns = ['type'];

      const queryBuilder = this.documentRepository.createQueryBuilder(
        this.alias,
      );

      queryBuilder
        .where('document.user_id = :userId', { userId: user.id })
        .andWhere('document.deleted_at IS NULL');

      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);
      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const documents = await queryBuilder.getMany();

      const countDocuments = await queryBuilder.getCount();

      const result = getPaginated({
        data: documents,
        count: countDocuments,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getById(documentId: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId, deletedAt: null },
    });

    if (!document) {
      throw new HttpException(
        ERROR_MESSAGES.documentNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return document;
  }

  async getByUserId(userId: string): Promise<Document[]> {
    const documents = await this.documentRepository.find({
      where: { userId, deletedAt: null },
    });

    if (!documents) {
      throw new HttpException(
        ERROR_MESSAGES.documentNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return documents;
  }

  async update(
    documentId: string,
    updateDocumentDto: UpdateDocumentDto,
  ): Promise<any> {
    try {
      const document = await this.documentRepository.findOne({
        where: { id: documentId, deletedAt: null },
      });

      if (!document) {
        throw new HttpException(
          ERROR_MESSAGES.documentNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const updatedDocument = this.documentRepository.create({
        ...document,
        ...updateDocumentDto,
      });

      await this.documentRepository.save(updatedDocument);

      return updatedDocument;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async delete(documentId: string) {
    const document = await this.documentRepository.findOne({
      where: { id: documentId, deletedAt: null },
    });

    if (!document) {
      throw new HttpException(
        ERROR_MESSAGES.documentNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.documentRepository.softDelete(documentId);

    return { deleted: true };
  }
}
