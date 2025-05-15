import { Document } from './entities/document.entity';
import { DocumentController } from './controllers/document.controller';
import { DocumentService } from './services/document.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Document])],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
