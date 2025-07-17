import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  InternalServerErrorException,
  Logger 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { 
  IngestionJob, 
  IngestionStatus, 
  IngestionType 
} from './entities/ingestion-job.entity';
import { CreateIngestionJobDto } from './dto/create-ingestion-job.dto';
import { DocumentsService } from '../documents/documents.service';
import { DocumentStatus } from '../documents/entities/document.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly pythonBackendUrl: string;

  constructor(
    @InjectRepository(IngestionJob)
    private ingestionJobRepository: Repository<IngestionJob>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private documentsService: DocumentsService,
    private configService: ConfigService,
  ) {
    this.pythonBackendUrl = this.configService.get<string>(
      'PYTHON_BACKEND_URL',
      'http://localhost:8000',
    );
  }

  async create(
    createIngestionJobDto: CreateIngestionJobDto,
    userId: string,
  ): Promise<IngestionJob> {
    // Validate input based on ingestion type
    await this.validateIngestionJobDto(createIngestionJobDto);

    // Find the user who triggered the job
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ingestionJob = this.ingestionJobRepository.create({
      ...createIngestionJobDto,
      triggeredBy: user,
      status: IngestionStatus.PENDING,
      configuration: createIngestionJobDto.configuration ? JSON.stringify(createIngestionJobDto.configuration) : null,
    });

    const savedJob = await this.ingestionJobRepository.save(ingestionJob);

    // Trigger ingestion asynchronously
    this.triggerIngestion(savedJob.id).catch((error) => {
      this.logger.error(`Failed to trigger ingestion for job ${savedJob.id}:`, error);
    });

    return savedJob;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: IngestionStatus,
    ingestionType?: IngestionType,
    userId?: string,
  ): Promise<{
    jobs: IngestionJob[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    
    const where: FindOptionsWhere<IngestionJob> = {};
    
    if (status) {
      where.status = status;
    }

    if (ingestionType) {
      where.ingestionType = ingestionType;
    }

    if (userId) {
      where.triggeredById = userId;
    }

    const [jobs, total] = await this.ingestionJobRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['triggeredBy', 'document'],
      select: {
        triggeredBy: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        document: {
          id: true,
          title: true,
          fileName: true,
          status: true,
        },
      },
    });

    return {
      jobs,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<IngestionJob> {
    const job = await this.ingestionJobRepository.findOne({
      where: { id },
      relations: ['triggeredBy', 'document'],
      select: {
        triggeredBy: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        document: {
          id: true,
          title: true,
          fileName: true,
          status: true,
          filePath: true,
          mimeType: true,
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Ingestion job not found');
    }

    return job;
  }

  async retry(id: string): Promise<IngestionJob> {
    const job = await this.findById(id);

    if (!job.canRetry) {
      throw new BadRequestException('Job cannot be retried');
    }

    job.status = IngestionStatus.PENDING;
    job.retryCount += 1;
    job.errorMessage = null;
    job.startedAt = null;
    job.completedAt = null;

    const updatedJob = await this.ingestionJobRepository.save(job);

    // Trigger ingestion asynchronously
    this.triggerIngestion(updatedJob.id).catch((error) => {
      this.logger.error(`Failed to retry ingestion for job ${updatedJob.id}:`, error);
    });

    return updatedJob;
  }

  async cancel(id: string): Promise<IngestionJob> {
    const job = await this.findById(id);

    if (job.isCompleted || job.isFailed) {
      throw new BadRequestException('Cannot cancel completed or failed job');
    }

    job.status = IngestionStatus.CANCELLED;
    job.completedAt = new Date();

    return await this.ingestionJobRepository.save(job);
  }

  async getIngestionStats(): Promise<{
    total: number;
    byStatus: Record<IngestionStatus, number>;
    byType: Record<IngestionType, number>;
    averageDuration: number;
  }> {
    const total = await this.ingestionJobRepository.count();

    const statusCounts = await Promise.all([
      this.ingestionJobRepository.count({ where: { status: IngestionStatus.PENDING } }),
      this.ingestionJobRepository.count({ where: { status: IngestionStatus.PROCESSING } }),
      this.ingestionJobRepository.count({ where: { status: IngestionStatus.COMPLETED } }),
      this.ingestionJobRepository.count({ where: { status: IngestionStatus.FAILED } }),
      this.ingestionJobRepository.count({ where: { status: IngestionStatus.CANCELLED } }),
    ]);

    const typeCounts = await Promise.all([
      this.ingestionJobRepository.count({ where: { ingestionType: IngestionType.SINGLE_DOCUMENT } }),
      this.ingestionJobRepository.count({ where: { ingestionType: IngestionType.BATCH_DOCUMENTS } }),
      this.ingestionJobRepository.count({ where: { ingestionType: IngestionType.REPROCESS } }),
    ]);

    // Calculate average duration for completed jobs
    const completedJobs = await this.ingestionJobRepository.find({
      where: { status: IngestionStatus.COMPLETED },
      select: ['startedAt', 'completedAt'],
    });

    const totalDuration = completedJobs.reduce((sum, job) => {
      if (job.startedAt && job.completedAt) {
        return sum + (job.completedAt.getTime() - job.startedAt.getTime());
      }
      return sum;
    }, 0);

    const averageDuration = completedJobs.length > 0 
      ? Math.floor(totalDuration / completedJobs.length / 1000) // in seconds
      : 0;

    return {
      total,
      byStatus: {
        [IngestionStatus.PENDING]: statusCounts[0],
        [IngestionStatus.PROCESSING]: statusCounts[1],
        [IngestionStatus.COMPLETED]: statusCounts[2],
        [IngestionStatus.FAILED]: statusCounts[3],
        [IngestionStatus.CANCELLED]: statusCounts[4],
      },
      byType: {
        [IngestionType.SINGLE_DOCUMENT]: typeCounts[0],
        [IngestionType.BATCH_DOCUMENTS]: typeCounts[1],
        [IngestionType.REPROCESS]: typeCounts[2],
      },
      averageDuration,
    };
  }

  private async triggerIngestion(jobId: string): Promise<void> {
    const job = await this.findById(jobId);

    try {
      // Update job status to processing
      job.status = IngestionStatus.PROCESSING;
      job.startedAt = new Date();
      await this.ingestionJobRepository.save(job);

      // Update document status to processing
      if (job.documentId) {
        await this.documentsService.updateStatus(job.documentId, DocumentStatus.PROCESSING);
      }

      // Prepare payload for Python backend
      const payload = await this.prepareIngestionPayload(job);

      // Call Python backend
      const response = await axios.post(
        `${this.pythonBackendUrl}/api/ingestion/trigger`,
        payload,
        {
          timeout: 30000, // 30 seconds timeout
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Update job with success
      job.status = IngestionStatus.COMPLETED;
      job.completedAt = new Date();
      job.result = JSON.stringify(response.data);
      job.progress = 100;

      // Update document status to processed
      if (job.documentId) {
        await this.documentsService.updateStatus(job.documentId, DocumentStatus.PROCESSED);
      }

    } catch (error) {
      this.logger.error(`Ingestion job ${jobId} failed:`, error.message);

      // Update job with failure
      job.status = IngestionStatus.FAILED;
      job.completedAt = new Date();
      job.errorMessage = error.message || 'Unknown error occurred';

      // Update document status to error
      if (job.documentId) {
        await this.documentsService.updateStatus(job.documentId, DocumentStatus.ERROR);
      }
    } finally {
      await this.ingestionJobRepository.save(job);
    }
  }

  private async prepareIngestionPayload(job: IngestionJob): Promise<any> {
    const payload: any = {
      job_id: job.id,
      ingestion_type: job.ingestionType,
      configuration: job.configuration ? JSON.parse(job.configuration) : {},
    };

    if (job.ingestionType === IngestionType.SINGLE_DOCUMENT && job.documentId) {
      const document = await this.documentsService.findById(job.documentId);
      payload.document = {
        id: document.id,
        title: document.title,
        file_path: document.filePath,
        mime_type: document.mimeType,
        file_size: document.fileSize,
      };
    } else if (job.ingestionType === IngestionType.BATCH_DOCUMENTS) {
      // For batch processing, we would need to implement logic to get multiple documents
      // This is a placeholder for batch processing implementation
      payload.documents = [];
    }

    return payload;
  }

  private async validateIngestionJobDto(dto: CreateIngestionJobDto): Promise<void> {
    if (dto.ingestionType === IngestionType.SINGLE_DOCUMENT) {
      if (!dto.documentId) {
        throw new BadRequestException('Document ID is required for single document ingestion');
      }
      
      // Verify document exists
      await this.documentsService.findById(dto.documentId);
    }

    if (dto.ingestionType === IngestionType.BATCH_DOCUMENTS) {
      if (!dto.documentIds || dto.documentIds.length === 0) {
        throw new BadRequestException('Document IDs are required for batch ingestion');
      }

      // Verify all documents exist
      for (const documentId of dto.documentIds) {
        await this.documentsService.findById(documentId);
      }
    }
  }
} 