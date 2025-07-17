import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Document } from '../../documents/entities/document.entity';
import { IngestionJob } from '../../ingestion/entities/ingestion-job.entity';

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: UserRole.VIEWER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Document, (document) => document.uploadedBy)
  uploadedDocuments: Document[];

  @OneToMany(() => IngestionJob, (ingestionJob) => ingestionJob.triggeredBy)
  triggeredIngestionJobs: IngestionJob[];

  // Computed properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  get isEditor(): boolean {
    return this.role === UserRole.EDITOR || this.role === UserRole.ADMIN;
  }

  get canManageUsers(): boolean {
    return this.role === UserRole.ADMIN;
  }

  get canUploadDocuments(): boolean {
    return this.role === UserRole.EDITOR || this.role === UserRole.ADMIN;
  }

  get canTriggerIngestion(): boolean {
    return this.role === UserRole.EDITOR || this.role === UserRole.ADMIN;
  }
} 