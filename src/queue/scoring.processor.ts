import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import {
  UploadJob,
  UploadJobStatus,
} from '../uploads/entities/upload-job.entity.js';
import { SCORING_QUEUE } from './queue.constants.js';

interface ScoringJobPayload {
  uploadJobId: string;
}

@Processor(SCORING_QUEUE)
export class ScoringProcessor extends WorkerHost {
  private readonly logger = new Logger(ScoringProcessor.name);

  constructor(
    @InjectRepository(UploadJob)
    private readonly uploadJobRepository: Repository<UploadJob>,
  ) {
    super();
  }

  async process(job: Job<ScoringJobPayload>): Promise<Record<string, unknown>> {
    const { uploadJobId } = job.data;
    this.logger.log(`Traitement du job ${job.id} (upload ${uploadJobId})`);

    await this.uploadJobRepository.update(uploadJobId, {
      status: UploadJobStatus.PROCESSING,
    });

    // Simulation d'un traitement long (parsing bilan/liasse fiscale, calcul de score...)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const result = {
      score: Math.round(Math.random() * 1000) / 10,
      processedAt: new Date().toISOString(), // nouvelle API JS : Temporal
    };

    await this.uploadJobRepository.update(uploadJobId, {
      status: UploadJobStatus.COMPLETED,
      result,
    });

    this.logger.log(`Job ${job.id} terminé, score : ${result.score}`);
    return result;
  }
}
