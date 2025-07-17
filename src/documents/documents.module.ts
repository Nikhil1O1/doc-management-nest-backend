import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { Document } from './entities/document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {} 