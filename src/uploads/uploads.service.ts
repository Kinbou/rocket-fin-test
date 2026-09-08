import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { UploadJob, UploadJobStatus } from './entities/upload-job.entity.js';
import { Organization } from '../organizations/entities/organization.entity.js';

const STORAGE_DIR = './storage/uploads';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(UploadJob)
    private readonly uploadJobRepository: Repository<UploadJob>,
  ) {}

  async createUpload(
    organization: Organization,
    file: Express.Multer.File,
    idempotencyKey: string,
  ): Promise<UploadJob> {
    // 1. Stockage du fichier sur disque
    await mkdir(STORAGE_DIR, { recursive: true });
    const storagePath = join(
      STORAGE_DIR,
      `${randomUUID()}-${file.originalname}`,
    );
    await writeFile(storagePath, file.buffer);

    // 2. Création du job en base (statut PENDING)
    const uploadJob = this.uploadJobRepository.create({
      organization,
      idempotencyKey,
      originalFilename: file.originalname,
      storagePath,
      status: UploadJobStatus.PENDING,
    });

    try {
      await this.uploadJobRepository.save(uploadJob);
    } catch {
      throw new ConflictException(
        'Une requête avec cette Idempotency-Key est déjà en cours',
      );
    }

    return uploadJob;
  }

  findOne(organization: Organization, id: string): Promise<UploadJob | null> {
    return this.uploadJobRepository.findOne({
      where: { id, organization: { id: organization.id } },
    });
  }
}
