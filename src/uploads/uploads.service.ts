import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { UploadJob, UploadJobStatus } from './entities/upload-job.entity.js';
import { Organization } from '../organizations/entities/organization.entity.js';
import { SCORING_QUEUE } from '../queue/queue.constants.js';

const STORAGE_DIR = './storage/uploads';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(UploadJob)
    private readonly uploadJobRepository: Repository<UploadJob>,
    @InjectQueue(SCORING_QUEUE)
    private readonly scoringQueue: Queue,
  ) {}

  async createUpload(
    organization: Organization,
    file: Express.Multer.File,
    idempotencyKey: string,
  ): Promise<UploadJob> {
    // 1. Idempotence : si ce couple (organisation, clé) existe déjà, on renvoie
    //    le job existant tel quel, sans rien recréer ni relancer de traitement.
    const existing = await this.uploadJobRepository.findOne({
      where: { organization: { id: organization.id }, idempotencyKey },
    });
    if (existing) {
      return existing;
    }

    await mkdir(STORAGE_DIR, { recursive: true });
    const storagePath = join(
      STORAGE_DIR,
      `${randomUUID()}-${file.originalname}`,
    );
    await writeFile(storagePath, file.buffer);

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
      // Race condition : deux requêtes quasi simultanées ont passé le check
      // ci-dessus en même temps. La contrainte unique en base a bloqué le
      // doublon — on récupère le job gagnant plutôt que de renvoyer une erreur.
      const winner = await this.uploadJobRepository.findOne({
        where: { organization: { id: organization.id }, idempotencyKey },
      });
      if (winner) return winner;
      throw new ConflictException(
        'Une requête avec cette Idempotency-Key est déjà en cours',
      );
    }

    await this.scoringQueue.add(
      'process-upload',
      { uploadJobId: uploadJob.id },
      { jobId: uploadJob.id },
    );

    await this.uploadJobRepository.update(uploadJob.id, {
      status: UploadJobStatus.QUEUED,
    });
    uploadJob.status = UploadJobStatus.QUEUED;

    return uploadJob;
  }

  findOne(organization: Organization, id: string): Promise<UploadJob | null> {
    return this.uploadJobRepository.findOne({
      where: { id, organization: { id: organization.id } },
    });
  }
}
