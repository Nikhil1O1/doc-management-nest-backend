import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IngestionJob } from '../../ingestion/entities/ingestion-job.entity';

export enum DocumentStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  ERROR = 'error',
}

export enum DocumentType {
  PDF = 'pdf',
  WORD = 'word',
  TEXT = 'text',
  HTML = 'html',
  MARKDOWN = 'markdown',
  OTHER = 'other',
}

@Entity('documents')
@Index(['title'])
@Index(['status'])
@Index(['documentType'])
@Index(['uploadedBy'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 255 })
  filePath: string;

  @Column({ length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ length: 255, nullable: true })
  checksum: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: DocumentType.OTHER,
  })
  documentType: DocumentType;

  @Column({
    type: 'varchar',
    length: 50,
    default: DocumentStatus.UPLOADED,
  })
  status: DocumentStatus;

  @Column({ type: 'text', nullable: true })
  metadata: string;

  @Column({ type: 'text', nullable: true })
  extractedText: string;

  @Column({ nullable: true })
  lastProcessedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.uploadedDocuments, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'uploadedBy' })
  uploadedBy: User;

  @Column({ name: 'uploadedBy', type: 'uuid', nullable: true })
  uploadedById: string;

  @OneToMany(() => IngestionJob, (ingestionJob) => ingestionJob.document)
  ingestionJobs: IngestionJob[];

  // Computed properties
  get isProcessed(): boolean {
    return this.status === DocumentStatus.PROCESSED;
  }

  get isProcessing(): boolean {
    return this.status === DocumentStatus.PROCESSING;
  }

  get hasError(): boolean {
    return this.status === DocumentStatus.ERROR;
  }

  get fileSizeInMB(): number {
    return Math.round((Number(this.fileSize) / (1024 * 1024)) * 100) / 100;
  }

  get fileExtension(): string {
    return this.fileName.split('.').pop()?.toLowerCase() || '';
  }
} 