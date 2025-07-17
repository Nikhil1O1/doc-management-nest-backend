import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  MaxLength,
  IsEnum 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '../entities/document.entity';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'Document title',
    example: 'Project Requirements Document',
    maxLength: 255,
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title: string;

  @ApiProperty({
    description: 'Document description',
    example: 'Detailed requirements for the new project implementation',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({
    description: 'Document type',
    enum: DocumentType,
    example: DocumentType.PDF,
    required: false,
  })
  @IsOptional()
  @IsEnum(DocumentType, { message: 'Invalid document type' })
  documentType?: DocumentType;

  // File-related properties will be handled by multer
  fileName?: string;
  filePath?: string;
  mimeType?: string;
  fileSize?: number;
  checksum?: string;
  uploadedById?: string;
} 