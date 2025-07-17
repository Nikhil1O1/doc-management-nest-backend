import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  InternalServerErrorException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { Document, DocumentStatus, DocumentType } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async create(
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
    userId: string,
  ): Promise<Document> {
    try {
      // Generate file checksum
      const checksum = crypto
        .createHash('md5')
        .update(file.buffer)
        .digest('hex');

      // Determine document type based on mime type
      const documentType = this.getDocumentTypeFromMimeType(file.mimetype);

      // Create document record
      const document = this.documentRepository.create({
        ...createDocumentDto,
        fileName: file.originalname,
        filePath: file.path || '',
        mimeType: file.mimetype,
        fileSize: file.size,
        checksum,
        documentType: createDocumentDto.documentType || documentType,
        uploadedById: userId,
        status: DocumentStatus.UPLOADED,
      });

      return await this.documentRepository.save(document);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create document');
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: DocumentStatus,
    documentType?: DocumentType,
    userId?: string,
  ): Promise<{ 
    documents: Document[]; 
    total: number; 
    page: number; 
    limit: number; 
  }> {
    const skip = (page - 1) * limit;
    
    const where: FindOptionsWhere<Document> = {};
    
    if (search) {
      where.title = ILike(`%${search}%`);
    }
    
    if (status) {
      where.status = status;
    }

    if (documentType) {
      where.documentType = documentType;
    }

    if (userId) {
      where.uploadedById = userId;
    }

    const [documents, total] = await this.documentRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['uploadedBy'],
      select: {
        uploadedBy: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    });

    return {
      documents,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
      select: {
        uploadedBy: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    const document = await this.findById(id);

    Object.assign(document, updateDocumentDto);
    return await this.documentRepository.save(document);
  }

  async updateStatus(id: string, status: DocumentStatus): Promise<Document> {
    const document = await this.findById(id);
    
    document.status = status;
    if (status === DocumentStatus.PROCESSED) {
      document.lastProcessedAt = new Date();
    }

    return await this.documentRepository.save(document);
  }

  async remove(id: string): Promise<void> {
    const document = await this.findById(id);

    // Delete physical file if it exists
    try {
      if (document.filePath) {
        await fs.unlink(document.filePath);
      }
    } catch (error) {
      // Log error but don't fail the operation
      console.warn(`Failed to delete file: ${document.filePath}`, error);
    }

    await this.documentRepository.remove(document);
  }

  async getDocumentStats(): Promise<{
    total: number;
    byStatus: Record<DocumentStatus, number>;
    byType: Record<DocumentType, number>;
    totalSize: number;
  }> {
    const total = await this.documentRepository.count();

    const statusCounts = await Promise.all([
      this.documentRepository.count({ where: { status: DocumentStatus.UPLOADED } }),
      this.documentRepository.count({ where: { status: DocumentStatus.PROCESSING } }),
      this.documentRepository.count({ where: { status: DocumentStatus.PROCESSED } }),
      this.documentRepository.count({ where: { status: DocumentStatus.ERROR } }),
    ]);

    const typeCounts = await Promise.all([
      this.documentRepository.count({ where: { documentType: DocumentType.PDF } }),
      this.documentRepository.count({ where: { documentType: DocumentType.WORD } }),
      this.documentRepository.count({ where: { documentType: DocumentType.TEXT } }),
      this.documentRepository.count({ where: { documentType: DocumentType.HTML } }),
      this.documentRepository.count({ where: { documentType: DocumentType.MARKDOWN } }),
      this.documentRepository.count({ where: { documentType: DocumentType.OTHER } }),
    ]);

    // Calculate total file size
    const result = await this.documentRepository
      .createQueryBuilder('document')
      .select('SUM(document.fileSize)', 'totalSize')
      .getRawOne();

    const totalSize = Number(result.totalSize) || 0;

    return {
      total,
      byStatus: {
        [DocumentStatus.UPLOADED]: statusCounts[0],
        [DocumentStatus.PROCESSING]: statusCounts[1],
        [DocumentStatus.PROCESSED]: statusCounts[2],
        [DocumentStatus.ERROR]: statusCounts[3],
      },
      byType: {
        [DocumentType.PDF]: typeCounts[0],
        [DocumentType.WORD]: typeCounts[1],
        [DocumentType.TEXT]: typeCounts[2],
        [DocumentType.HTML]: typeCounts[3],
        [DocumentType.MARKDOWN]: typeCounts[4],
        [DocumentType.OTHER]: typeCounts[5],
      },
      totalSize,
    };
  }

  async downloadDocument(id: string): Promise<{ 
    document: Document; 
    fileBuffer: Buffer; 
  }> {
    const document = await this.findById(id);

    try {
      const fileBuffer = await fs.readFile(document.filePath);
      return { document, fileBuffer };
    } catch (error) {
      throw new NotFoundException('Document file not found on disk');
    }
  }

  private getDocumentTypeFromMimeType(mimeType: string): DocumentType {
    const mimeTypeMap: Record<string, DocumentType> = {
      'application/pdf': DocumentType.PDF,
      'application/msword': DocumentType.WORD,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': DocumentType.WORD,
      'text/plain': DocumentType.TEXT,
      'text/html': DocumentType.HTML,
      'text/markdown': DocumentType.MARKDOWN,
      'application/x-markdown': DocumentType.MARKDOWN,
    };

    return mimeTypeMap[mimeType] || DocumentType.OTHER;
  }

  async updateExtractedText(id: string, extractedText: string): Promise<Document> {
    const document = await this.findById(id);
    
    document.extractedText = extractedText;
    document.lastProcessedAt = new Date();
    
    return await this.documentRepository.save(document);
  }

  async findDocumentsForIngestion(limit: number = 10): Promise<Document[]> {
    return await this.documentRepository.find({
      where: { 
        status: DocumentStatus.UPLOADED 
      },
      take: limit,
      order: { createdAt: 'ASC' },
    });
  }
} 