import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { DocumentStatus, DocumentType } from './entities/document.entity';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/html',
          'text/markdown',
          'application/x-markdown',
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  @ApiOperation({ summary: 'Upload a document (Editor/Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        title: {
          type: 'string',
          example: 'Project Requirements',
        },
        description: {
          type: 'string',
          example: 'Detailed requirements document',
        },
        documentType: {
          type: 'string',
          enum: Object.values(DocumentType),
        },
      },
      required: ['file', 'title'],
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor/Admin role required' })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
    @Request() req,
  ) {
    return this.documentsService.create(createDocumentDto, file, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: DocumentStatus })
  @ApiQuery({ name: 'documentType', required: false, enum: DocumentType })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: DocumentStatus,
    @Query('documentType') documentType?: DocumentType,
    @Query('userId') userId?: string,
  ) {
    return this.documentsService.findAll(page, limit, search, status, documentType, userId);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get document statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Document statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        byStatus: {
          type: 'object',
          properties: {
            uploaded: { type: 'number' },
            processing: { type: 'number' },
            processed: { type: 'number' },
            error: { type: 'number' },
          },
        },
        byType: {
          type: 'object',
          properties: {
            pdf: { type: 'number' },
            word: { type: 'number' },
            text: { type: 'number' },
            html: { type: 'number' },
            markdown: { type: 'number' },
            other: { type: 'number' },
          },
        },
        totalSize: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  getStats() {
    return this.documentsService.getDocumentStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findById(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download document file' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Document file downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async downloadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { document, fileBuffer } = await this.documentsService.downloadDocument(id);
    
    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.fileName}"`,
      'Content-Length': document.fileSize.toString(),
    });

    return new StreamableFile(fileBuffer);
  }

  @Patch(':id')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update document metadata (Editor/Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Document updated successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor/Admin role required' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update document status (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(DocumentStatus),
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Document status updated successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: DocumentStatus,
  ) {
    return this.documentsService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete document (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.remove(id);
  }
} 