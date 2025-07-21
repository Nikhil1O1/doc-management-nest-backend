import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Document, DocumentStatus, DocumentType } from './entities/document.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let repository: Repository<Document>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(Document),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    repository = module.get<Repository<Document>>(getRepositoryToken(Document));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException when file is missing', async () => {
      const createDocumentDto = {
        title: 'Test Document',
        description: 'Test Description',
      };

      await expect(service.create(createDocumentDto, null, 'user-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create a document successfully', async () => {
      const createDocumentDto = {
        title: 'Test Document',
        description: 'Test Description',
      };

      const mockFile = {
        originalname: 'test.txt',
        path: '/uploads/test.txt',
        mimetype: 'text/plain',
        size: 1024,
        buffer: Buffer.from('test content'),
      } as Express.Multer.File;

      const mockDocument = {
        id: '1',
        title: 'Test Document',
        fileName: 'test.txt',
        status: DocumentStatus.UPLOADED,
      };

      mockRepository.create.mockReturnValue(mockDocument);
      mockRepository.save.mockResolvedValue(mockDocument);

      const result = await service.create(createDocumentDto, mockFile, 'user-id');

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(mockDocument);
      expect(result).toEqual(mockDocument);
    });
  });

  describe('findById', () => {
    it('should return a document when found', async () => {
      const mockDocument = {
        id: '1',
        title: 'Test Document',
        status: DocumentStatus.UPLOADED,
      };

      mockRepository.findOne.mockResolvedValue(mockDocument);

      const result = await service.findById('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
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
      expect(result).toEqual(mockDocument);
    });

    it('should throw NotFoundException when document not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
    });
  });
}); 