import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Public } from '../auth/decorators/public.decorator';

interface CreateDocumentDto {
  title: string;
  description?: string;
  documentType?: 'pdf' | 'word' | 'text' | 'html' | 'markdown' | 'other';
}

interface UpdateDocumentDto {
  title?: string;
  description?: string;
  documentType?: 'pdf' | 'word' | 'text' | 'html' | 'markdown' | 'other';
}

@ApiTags('Documents (Demo)')
@Controller('documents')
@ApiBearerAuth('JWT-auth')
export class DocumentsDemoController {
  private demoDocuments = [
    {
      id: 'demo-doc-1',
      title: 'Project Requirements Document',
      description: 'Detailed requirements for the new project implementation',
      fileName: 'requirements.pdf',
      filePath: '/uploads/demo-requirements.pdf',
      mimeType: 'application/pdf',
      fileSize: 1048576, // 1MB
      documentType: 'pdf',
      status: 'processed',
      uploadedBy: {
        id: 'demo-user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'demo-doc-2',
      title: 'Technical Specification',
      description: 'Technical details and architecture overview',
      fileName: 'tech-spec.docx',
      filePath: '/uploads/demo-tech-spec.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 2097152, // 2MB
      documentType: 'word',
      status: 'processing',
      uploadedBy: {
        id: 'demo-user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
      },
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'demo-doc-3',
      title: 'Meeting Notes',
      description: 'Notes from project kickoff meeting',
      fileName: 'meeting-notes.txt',
      filePath: '/uploads/demo-meeting-notes.txt',
      mimeType: 'text/plain',
      fileSize: 8192, // 8KB
      documentType: 'text',
      status: 'uploaded',
      uploadedBy: {
        id: 'demo-user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      },
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date(Date.now() - 259200000).toISOString(),
    },
  ];

  @Post('upload')
  @Public()
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
  @ApiOperation({ summary: 'Upload a document (Demo - Editor/Admin only)' })
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
          enum: ['pdf', 'word', 'text', 'html', 'markdown', 'other'],
        },
      },
      required: ['file', 'title'],
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully (Demo)' })
  @ApiResponse({ status: 400, description: 'Invalid file or data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor/Admin role required' })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
  ) {
    // Simulate file processing
    const documentType = this.getDocumentTypeFromMimeType(file?.mimetype || 'application/octet-stream');
    
    const newDocument = {
      id: 'demo-doc-' + Date.now(),
      title: createDocumentDto.title,
      description: createDocumentDto.description || '',
      fileName: file?.originalname || 'demo-file.pdf',
      filePath: file?.path || '/uploads/demo-file.pdf',
      mimeType: file?.mimetype || 'application/pdf',
      fileSize: file?.size || 1024000,
      documentType: createDocumentDto.documentType || documentType,
      status: 'uploaded',
      uploadedBy: {
        id: 'demo-user-current',
        firstName: 'Current',
        lastName: 'User',
        email: 'current@example.com',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.demoDocuments.push(newDocument);

    return {
      message: 'Document uploaded successfully (Demo Mode)',
      document: newDocument,
    };
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all documents with pagination (Demo)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['uploaded', 'processing', 'processed', 'error'] })
  @ApiQuery({ name: 'documentType', required: false, enum: ['pdf', 'word', 'text', 'html', 'markdown', 'other'] })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully (Demo)' })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('documentType') documentType?: string,
    @Query('userId') userId?: string,
  ) {
    let filteredDocuments = [...this.demoDocuments];

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.title.toLowerCase().includes(searchLower) ||
        doc.description.toLowerCase().includes(searchLower) ||
        doc.fileName.toLowerCase().includes(searchLower)
      );
    }

    if (status) {
      filteredDocuments = filteredDocuments.filter(doc => doc.status === status);
    }

    if (documentType) {
      filteredDocuments = filteredDocuments.filter(doc => doc.documentType === documentType);
    }

    if (userId) {
      filteredDocuments = filteredDocuments.filter(doc => doc.uploadedBy.id === userId);
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    const paginatedDocuments = filteredDocuments.slice(skip, skip + limit);

    return {
      documents: paginatedDocuments,
      total: filteredDocuments.length,
      page,
      limit,
      message: 'Documents retrieved successfully (Demo Mode)',
    };
  }

  @Get('stats')
  @Public()
  @ApiOperation({ summary: 'Get document statistics (Demo - Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Document statistics retrieved successfully (Demo)',
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
    const total = this.demoDocuments.length;
    const totalSize = this.demoDocuments.reduce((sum, doc) => sum + doc.fileSize, 0);

    const byStatus = {
      uploaded: this.demoDocuments.filter(doc => doc.status === 'uploaded').length,
      processing: this.demoDocuments.filter(doc => doc.status === 'processing').length,
      processed: this.demoDocuments.filter(doc => doc.status === 'processed').length,
      error: this.demoDocuments.filter(doc => doc.status === 'error').length,
    };

    const byType = {
      pdf: this.demoDocuments.filter(doc => doc.documentType === 'pdf').length,
      word: this.demoDocuments.filter(doc => doc.documentType === 'word').length,
      text: this.demoDocuments.filter(doc => doc.documentType === 'text').length,
      html: this.demoDocuments.filter(doc => doc.documentType === 'html').length,
      markdown: this.demoDocuments.filter(doc => doc.documentType === 'markdown').length,
      other: this.demoDocuments.filter(doc => doc.documentType === 'other').length,
    };

    return {
      total,
      byStatus,
      byType,
      totalSize,
      message: 'Document statistics retrieved successfully (Demo Mode)',
    };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get document by ID (Demo)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully (Demo)' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  findOne(@Param('id') id: string) {
    const document = this.demoDocuments.find(doc => doc.id === id);
    
    if (!document) {
      return {
        message: 'Document not found',
        error: 'Not Found',
        statusCode: 404,
      };
    }

    return {
      document,
      message: 'Document retrieved successfully (Demo Mode)',
    };
  }

  @Get(':id/download')
  @Public()
  @ApiOperation({ summary: 'Download document file (Demo)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Document file downloaded successfully (Demo)' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async downloadDocument(@Param('id') id: string) {
    const document = this.demoDocuments.find(doc => doc.id === id);
    
    if (!document) {
      return {
        message: 'Document not found',
        error: 'Not Found',
        statusCode: 404,
      };
    }

    return {
      message: 'Document download initiated (Demo Mode)',
      document: {
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
      },
      downloadUrl: document.filePath,
    };
  }

  @Patch(':id')
  @Public()
  @ApiOperation({ summary: 'Update document metadata (Demo - Editor/Admin only)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Document updated successfully (Demo)' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor/Admin role required' })
  update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    const documentIndex = this.demoDocuments.findIndex(doc => doc.id === id);
    
    if (documentIndex === -1) {
      return {
        message: 'Document not found',
        error: 'Not Found',
        statusCode: 404,
      };
    }

    // Update document
    this.demoDocuments[documentIndex] = {
      ...this.demoDocuments[documentIndex],
      ...updateDocumentDto,
      updatedAt: new Date().toISOString(),
    };

    return {
      document: this.demoDocuments[documentIndex],
      message: 'Document updated successfully (Demo Mode)',
    };
  }

  @Patch(':id/status')
  @Public()
  @ApiOperation({ summary: 'Update document status (Demo - Admin only)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['uploaded', 'processing', 'processed', 'error'],
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Document status updated successfully (Demo)' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    const documentIndex = this.demoDocuments.findIndex(doc => doc.id === id);
    
    if (documentIndex === -1) {
      return {
        message: 'Document not found',
        error: 'Not Found',
        statusCode: 404,
      };
    }

    this.demoDocuments[documentIndex].status = status;
    this.demoDocuments[documentIndex].updatedAt = new Date().toISOString();

    return {
      document: this.demoDocuments[documentIndex],
      message: 'Document status updated successfully (Demo Mode)',
    };
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete document (Demo - Admin only)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully (Demo)' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  remove(@Param('id') id: string) {
    const documentIndex = this.demoDocuments.findIndex(doc => doc.id === id);
    
    if (documentIndex === -1) {
      return {
        message: 'Document not found',
        error: 'Not Found',
        statusCode: 404,
      };
    }

    const deletedDocument = this.demoDocuments.splice(documentIndex, 1)[0];

    return {
      document: deletedDocument,
      message: 'Document deleted successfully (Demo Mode)',
    };
  }

  private getDocumentTypeFromMimeType(mimeType: string): string {
    const typeMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/msword': 'word',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
      'text/plain': 'text',
      'text/html': 'html',
      'text/markdown': 'markdown',
      'application/x-markdown': 'markdown',
    };

    return typeMap[mimeType] || 'other';
  }
} 