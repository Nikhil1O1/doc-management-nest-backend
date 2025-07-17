import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { IngestionService } from './ingestion.service';
import { CreateIngestionJobDto } from './dto/create-ingestion-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { IngestionStatus, IngestionType } from './entities/ingestion-job.entity';

@ApiTags('Ingestion')
@Controller('ingestion')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('jobs')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new ingestion job (Editor/Admin only)' })
  @ApiResponse({ status: 201, description: 'Ingestion job created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor/Admin role required' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  create(@Body() createIngestionJobDto: CreateIngestionJobDto, @Request() req) {
    return this.ingestionService.create(createIngestionJobDto, req.user.id);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get all ingestion jobs with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: IngestionStatus })
  @ApiQuery({ name: 'ingestionType', required: false, enum: IngestionType })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Ingestion jobs retrieved successfully' })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('status') status?: IngestionStatus,
    @Query('ingestionType') ingestionType?: IngestionType,
    @Query('userId') userId?: string,
  ) {
    return this.ingestionService.findAll(page, limit, status, ingestionType, userId);
  }

  @Get('jobs/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get ingestion job statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Ingestion statistics retrieved successfully',
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
    return this.ingestionService.getIngestionStats();
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get ingestion job by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ingestion job retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ingestion job not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ingestionService.findById(id);
  }

  @Patch('jobs/:id/retry')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Retry a failed ingestion job (Editor/Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ingestion job retry initiated successfully' })
  @ApiResponse({ status: 400, description: 'Job cannot be retried' })
  @ApiResponse({ status: 404, description: 'Ingestion job not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor/Admin role required' })
  retry(@Param('id', ParseUUIDPipe) id: string) {
    return this.ingestionService.retry(id);
  }

  @Patch('jobs/:id/cancel')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel a pending/processing ingestion job (Editor/Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ingestion job cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Job cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Ingestion job not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Editor/Admin role required' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.ingestionService.cancel(id);
  }
} 