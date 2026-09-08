import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
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
    this.logger.log(
      `Traitement du job ${job.id} (tentative ${job.attemptsMade + 1})`,
    );

    await this.uploadJobRepository.update(uploadJobId, {
      status: UploadJobStatus.PROCESSING,
      attempts: job.attemptsMade + 1,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Échec simulé sur la toute première tentative, pour observer le retry.
    // job.attemptsMade vaut 0 lors du tout premier essai.
    if (job.attemptsMade === 0) {
      throw new Error('Échec simulé du traitement (démo retry/backoff)');
    }

    const result = {
      score: Math.round(Math.random() * 1000) / 10,
      processedAt: new Date().toISOString(),
    };

    await this.uploadJobRepository.update(uploadJobId, {
      status: UploadJobStatus.COMPLETED,
      result,
    });

    this.logger.log(
      `Job ${job.id} terminé avec succès, score : ${result.score}`,
    );
    return result;
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<ScoringJobPayload>, error: Error) {
    this.logger.warn(
      `Job ${job.id} a échoué (tentative ${job.attemptsMade}) : ${error.message}`,
    );

    const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
    if (isLastAttempt) {
      await this.uploadJobRepository.update(job.data.uploadJobId, {
        status: UploadJobStatus.FAILED,
        errorMessage: error.message,
      });
      this.logger.error(
        `Job ${job.id} définitivement échoué après ${job.attemptsMade} tentatives`,
      );
    }
  }
}
