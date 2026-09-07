import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity.js';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  hashedKey: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  organization: Relation<Organization>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
