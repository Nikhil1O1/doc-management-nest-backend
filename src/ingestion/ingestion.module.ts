import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';
import { IngestionJob } from './entities/ingestion-job.entity';
import { User } from '../users/entities/user.entity';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IngestionJob, User]),
    DocumentsModule,
  ],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {} 