import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEnum,
  IsUUID,
  IsArray,
  IsObject 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IngestionType } from '../entities/ingestion-job.entity';

export class CreateIngestionJobDto {
  @ApiProperty({
    description: 'Ingestion job name',
    example: 'Process Project Documents',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @ApiProperty({
    description: 'Ingestion job description',
    example: 'Process all uploaded project documents for RAG system',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({
    description: 'Type of ingestion job',
    enum: IngestionType,
    example: IngestionType.SINGLE_DOCUMENT,
  })
  @IsEnum(IngestionType, { message: 'Invalid ingestion type' })
  @IsNotEmpty({ message: 'Ingestion type is required' })
  ingestionType: IngestionType;

  @ApiProperty({
    description: 'Document ID for single document ingestion',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: 'Document ID must be a valid UUID' })
  documentId?: string;

  @ApiProperty({
    description: 'Array of document IDs for batch ingestion',
    example: ['123e4567-e89b-12d3-a456-426614174000', '987fcdeb-51a2-43d1-b456-426614174001'],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Document IDs must be an array' })
  @IsUUID(4, { each: true, message: 'Each document ID must be a valid UUID' })
  documentIds?: string[];

  @ApiProperty({
    description: 'Configuration for the ingestion job',
    example: { embedding_model: 'text-embedding-ada-002', chunk_size: 1000 },
    required: false,
  })
  @IsOptional()
  @IsObject({ message: 'Configuration must be an object' })
  configuration?: Record<string, any>;
} 