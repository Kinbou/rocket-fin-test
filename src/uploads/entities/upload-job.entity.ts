import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity.js';

export enum UploadJobStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('upload_jobs')
@Index(['organization', 'idempotencyKey'], { unique: true })
export class UploadJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  organization: Relation<Organization>;

  @Column()
  idempotencyKey: string;

  @Column()
  originalFilename: string;

  @Column()
  storagePath: string;

  @Column({
    type: 'enum',
    enum: UploadJobStatus,
    default: UploadJobStatus.PENDING,
  })
  status: UploadJobStatus;

  @Column({ default: 0 })
  attempts: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
