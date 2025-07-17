import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Document } from '../../documents/entities/document.entity';

export enum IngestionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum IngestionType {
  SINGLE_DOCUMENT = 'single_document',
  BATCH_DOCUMENTS = 'batch_documents',
  REPROCESS = 'reprocess',
}

@Entity('ingestion_jobs')
@Index(['status'])
@Index(['ingestionType'])
@Index(['triggeredBy'])
@Index(['document'])
export class IngestionJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: IngestionStatus.PENDING,
  })
  status: IngestionStatus;

  @Column({
    type: 'varchar',
    length: 50,
    default: IngestionType.SINGLE_DOCUMENT,
  })
  ingestionType: IngestionType;

  @Column({ type: 'text', nullable: true })
  configuration: string;

  @Column({ type: 'text', nullable: true })
  result: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'text', nullable: true })
  logs: string;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ type: 'integer', default: 0 })
  progress: number; // 0-100

  @Column({ type: 'integer', default: 0 })
  retryCount: number;

  @Column({ type: 'integer', default: 3 })
  maxRetries: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.triggeredIngestionJobs, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'triggeredBy' })
  triggeredBy: User;

  @Column({ name: 'triggeredBy', type: 'uuid', nullable: true })
  triggeredById: string;

  @ManyToOne(() => Document, (document) => document.ingestionJobs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column({ name: 'documentId', type: 'uuid', nullable: true })
  documentId: string;

  // Computed properties
  get isCompleted(): boolean {
    return this.status === IngestionStatus.COMPLETED;
  }

  get isFailed(): boolean {
    return this.status === IngestionStatus.FAILED;
  }

  get isProcessing(): boolean {
    return this.status === IngestionStatus.PROCESSING;
  }

  get isPending(): boolean {
    return this.status === IngestionStatus.PENDING;
  }

  get canRetry(): boolean {
    return this.isFailed && this.retryCount < this.maxRetries;
  }

  get duration(): number | null {
    if (!this.startedAt || !this.completedAt) {
      return null;
    }
    return this.completedAt.getTime() - this.startedAt.getTime();
  }

  get durationInSeconds(): number | null {
    const duration = this.duration;
    return duration ? Math.floor(duration / 1000) : null;
  }
} 