import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

interface CreateIngestionJobDto {
  name?: string;
  description?: string;
  ingestionType: 'single_document' | 'batch_documents' | 'reprocess';
  documentId?: string;
  documentIds?: string[];
  configuration?: Record<string, any>;
}

@ApiTags('Ingestion (Demo)')
@Controller('ingestion')
@ApiBearerAuth('JWT-auth')
export class IngestionDemoController {
  private demoIngestionJobs: any[] = [
    {
      id: 'demo-job-1',
      name: 'Process Requirements Document',
      description: 'Processing project requirements for RAG system',
      status: 'completed',
      ingestionType: 'single_document',
      documentId: 'demo-doc-1',
      document: {
        id: 'demo-doc-1',
        title: 'Project Requirements Document',
        fileName: 'requirements.pdf',
        status: 'processed',
      },
      configuration: {
        embedding_model: 'text-embedding-ada-002',
        chunk_size: 1000,
        chunk_overlap: 200,
      },
      result: {
        chunks_processed: 45,
        embeddings_created: 45,
        processing_time: 12.5,
      },
      progress: 100,
      retryCount: 0,
      maxRetries: 3,
      startedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      completedAt: new Date(Date.now() - 3300000).toISOString(), // 55 minutes ago
      triggeredBy: {
        id: 'demo-user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3300000).toISOString(),
    },
    {
      id: 'demo-job-2',
      name: 'Process Technical Specification',
      description: 'Processing technical spec document',
      status: 'processing',
      ingestionType: 'single_document',
      documentId: 'demo-doc-2',
      document: {
        id: 'demo-doc-2',
        title: 'Technical Specification',
        fileName: 'tech-spec.docx',
        status: 'processing',
      },
      configuration: {
        embedding_model: 'text-embedding-ada-002',
        chunk_size: 800,
        chunk_overlap: 150,
      },
      result: null,
      progress: 65,
      retryCount: 0,
      maxRetries: 3,
      startedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      completedAt: null,
      triggeredBy: {
        id: 'demo-user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
      },
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    },
    {
      id: 'demo-job-3',
      name: 'Failed Processing Job',
      description: 'Failed to process meeting notes',
      status: 'failed',
      ingestionType: 'single_document',
      documentId: 'demo-doc-3',
      document: {
        id: 'demo-doc-3',
        title: 'Meeting Notes',
        fileName: 'meeting-notes.txt',
        status: 'error',
      },
      configuration: {
        embedding_model: 'text-embedding-ada-002',
        chunk_size: 1000,
      },
      result: null,
      errorMessage: 'Connection timeout to Python backend service',
      progress: 0,
      retryCount: 2,
      maxRetries: 3,
      startedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      completedAt: new Date(Date.now() - 6900000).toISOString(), // 1 hour 55 minutes ago
      triggeredBy: {
        id: 'demo-user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      },
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 6900000).toISOString(),
    },
  ];

  @Post('jobs')
  @Public()
  @ApiOperation({ summary: 'Create a new ingestion job (Demo - Editor/Admin only)' })
  @ApiResponse({ status: 201, description: 'Ingestion job created successfully (Demo)' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor/Admin role required' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  create(@Body() createIngestionJobDto: CreateIngestionJobDto) {
    const newJob = {
      id: 'demo-job-' + Date.now(),
      name: createIngestionJobDto.name || 'Demo Ingestion Job',
      description: createIngestionJobDto.description || 'Demo ingestion job description',
      status: 'pending',
      ingestionType: createIngestionJobDto.ingestionType,
      documentId: createIngestionJobDto.documentId || null,
      document: createIngestionJobDto.documentId ? {
        id: createIngestionJobDto.documentId,
        title: 'Demo Document',
        fileName: 'demo-document.pdf',
        status: 'uploaded',
      } : null,
      configuration: createIngestionJobDto.configuration || {
        embedding_model: 'text-embedding-ada-002',
        chunk_size: 1000,
        chunk_overlap: 200,
      },
      result: null,
      errorMessage: null,
      progress: 0,
      retryCount: 0,
      maxRetries: 3,
      startedAt: null,
      completedAt: null,
      triggeredBy: {
        id: 'demo-user-current',
        firstName: 'Current',
        lastName: 'User',
        email: 'current@example.com',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.demoIngestionJobs.push(newJob);

    // Simulate async processing start
    setTimeout(() => {
      const jobIndex = this.demoIngestionJobs.findIndex(job => job.id === newJob.id);
      if (jobIndex !== -1) {
        this.demoIngestionJobs[jobIndex].status = 'processing';
        this.demoIngestionJobs[jobIndex].startedAt = new Date().toISOString();
        this.demoIngestionJobs[jobIndex].progress = 25;
      }
    }, 2000);

    return {
      message: 'Ingestion job created successfully (Demo Mode)',
      job: newJob,
    };
  }

  @Get('jobs')
  @Public()
  @ApiOperation({ summary: 'Get all ingestion jobs with pagination (Demo)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'] })
  @ApiQuery({ name: 'ingestionType', required: false, enum: ['single_document', 'batch_documents', 'reprocess'] })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Ingestion jobs retrieved successfully (Demo)' })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('status') status?: string,
    @Query('ingestionType') ingestionType?: string,
    @Query('userId') userId?: string,
  ) {
    let filteredJobs = [...this.demoIngestionJobs];

    // Apply filters
    if (status) {
      filteredJobs = filteredJobs.filter(job => job.status === status);
    }

    if (ingestionType) {
      filteredJobs = filteredJobs.filter(job => job.ingestionType === ingestionType);
    }

    if (userId) {
      filteredJobs = filteredJobs.filter(job => job.triggeredBy.id === userId);
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    const paginatedJobs = filteredJobs.slice(skip, skip + limit);

    return {
      jobs: paginatedJobs,
      total: filteredJobs.length,
      page,
      limit,
      message: 'Ingestion jobs retrieved successfully (Demo Mode)',
    };
  }

  @Get('jobs/stats')
  @Public()
  @ApiOperation({ summary: 'Get ingestion job statistics (Demo - Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Ingestion statistics retrieved successfully (Demo)',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        byStatus: {
          type: 'object',
          properties: {
            pending: { type: 'number' },
            processing: { type: 'number' },
            completed: { type: 'number' },
            failed: { type: 'number' },
            cancelled: { type: 'number' },
          },
        },
        byType: {
          type: 'object',
          properties: {
            single_document: { type: 'number' },
            batch_documents: { type: 'number' },
            reprocess: { type: 'number' },
          },
        },
        averageDuration: { type: 'number', description: 'Average duration in seconds' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  getStats() {
    const total = this.demoIngestionJobs.length;

    const byStatus = {
      pending: this.demoIngestionJobs.filter(job => job.status === 'pending').length,
      processing: this.demoIngestionJobs.filter(job => job.status === 'processing').length,
      completed: this.demoIngestionJobs.filter(job => job.status === 'completed').length,
      failed: this.demoIngestionJobs.filter(job => job.status === 'failed').length,
      cancelled: this.demoIngestionJobs.filter(job => job.status === 'cancelled').length,
    };

    const byType = {
      single_document: this.demoIngestionJobs.filter(job => job.ingestionType === 'single_document').length,
      batch_documents: this.demoIngestionJobs.filter(job => job.ingestionType === 'batch_documents').length,
      reprocess: this.demoIngestionJobs.filter(job => job.ingestionType === 'reprocess').length,
    };

    // Calculate average duration for completed jobs
    const completedJobs = this.demoIngestionJobs.filter(job => 
      job.status === 'completed' && job.startedAt && job.completedAt
    );
    
    const averageDuration = completedJobs.length > 0 
      ? completedJobs.reduce((sum, job) => {
          const duration = new Date(job.completedAt!).getTime() - new Date(job.startedAt!).getTime();
          return sum + (duration / 1000); // Convert to seconds
        }, 0) / completedJobs.length
      : 0;

    return {
      total,
      byStatus,
      byType,
      averageDuration: Math.round(averageDuration * 100) / 100,
      message: 'Ingestion statistics retrieved successfully (Demo Mode)',
    };
  }

  @Get('jobs/:id')
  @Public()
  @ApiOperation({ summary: 'Get ingestion job by ID (Demo)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Ingestion job retrieved successfully (Demo)' })
  @ApiResponse({ status: 404, description: 'Ingestion job not found' })
  findOne(@Param('id') id: string) {
    const job = this.demoIngestionJobs.find(j => j.id === id);
    
    if (!job) {
      return {
        message: 'Ingestion job not found',
        error: 'Not Found',
        statusCode: 404,
      };
    }

    return {
      job,
      message: 'Ingestion job retrieved successfully (Demo Mode)',
    };
  }

  @Patch('jobs/:id/retry')
  @Public()
  @ApiOperation({ summary: 'Retry a failed ingestion job (Demo - Editor/Admin only)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Ingestion job retry initiated successfully (Demo)' })
  @ApiResponse({ status: 400, description: 'Job cannot be retried' })
  @ApiResponse({ status: 404, description: 'Ingestion job not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor/Admin role required' })
  retry(@Param('id') id: string) {
    const jobIndex = this.demoIngestionJobs.findIndex(j => j.id === id);
    
    if (jobIndex === -1) {
      return {
        message: 'Ingestion job not found',
        error: 'Not Found',
        statusCode: 404,
      };
    }

    const job = this.demoIngestionJobs[jobIndex];

    if (job.status !== 'failed' || job.retryCount >= job.maxRetries) {
      return {
        message: 'Job cannot be retried',
        error: 'Bad Request',
        statusCode: 400,
      };
    }

    // Reset job for retry
    this.demoIngestionJobs[jobIndex] = {
      ...job,
      status: 'pending',
      retryCount: job.retryCount + 1,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
      progress: 0,
      updatedAt: new Date().toISOString(),
    };

    // Simulate retry processing start
    setTimeout(() => {
      const retryJobIndex = this.demoIngestionJobs.findIndex(j => j.id === id);
      if (retryJobIndex !== -1) {
        this.demoIngestionJobs[retryJobIndex].status = 'processing';
        this.demoIngestionJobs[retryJobIndex].startedAt = new Date().toISOString();
        this.demoIngestionJobs[retryJobIndex].progress = 15;
      }
    }, 1000);

    return {
      job: this.demoIngestionJobs[jobIndex],
      message: 'Ingestion job retry initiated successfully (Demo Mode)',
    };
  }

  @Patch('jobs/:id/cancel')
  @Public()
  @ApiOperation({ summary: 'Cancel a pending/processing ingestion job (Demo - Editor/Admin only)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Ingestion job cancelled successfully (Demo)' })
  @ApiResponse({ status: 400, description: 'Job cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Ingestion job not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor/Admin role required' })
  cancel(@Param('id') id: string) {
    const jobIndex = this.demoIngestionJobs.findIndex(j => j.id === id);
    
    if (jobIndex === -1) {
      return {
        message: 'Ingestion job not found',
        error: 'Not Found',
        statusCode: 404,
      };
    }

    const job = this.demoIngestionJobs[jobIndex];

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return {
        message: 'Cannot cancel completed, failed, or already cancelled job',
        error: 'Bad Request',
        statusCode: 400,
      };
    }

    // Cancel job
    this.demoIngestionJobs[jobIndex] = {
      ...job,
      status: 'cancelled',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      job: this.demoIngestionJobs[jobIndex],
      message: 'Ingestion job cancelled successfully (Demo Mode)',
    };
  }

  @Post('trigger')
  @Public()
  @ApiOperation({ summary: 'Trigger ingestion process in Python backend (Demo)' })
  @ApiResponse({ status: 200, description: 'Ingestion process triggered successfully (Demo)' })
  @ApiResponse({ status: 500, description: 'Failed to trigger ingestion process' })
  triggerPythonBackend(@Body() payload: any) {
    // Simulate Python backend call
    return {
      message: 'Ingestion process triggered successfully (Demo Mode)',
      pythonBackendResponse: {
        status: 'accepted',
        job_id: payload.job_id || 'demo-python-job-' + Date.now(),
        estimated_duration: '5-10 minutes',
        webhook_url: 'http://localhost:3000/api/v1/ingestion/webhook',
      },
      payload,
    };
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Webhook endpoint for Python backend callbacks (Demo)' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully (Demo)' })
  handleWebhook(@Body() webhookData: any) {
    // Simulate webhook processing
    return {
      message: 'Webhook processed successfully (Demo Mode)',
      received: webhookData,
      processed_at: new Date().toISOString(),
    };
  }
} 