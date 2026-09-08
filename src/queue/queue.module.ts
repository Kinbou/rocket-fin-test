import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UploadJob } from '../uploads/entities/upload-job.entity.js';
import { SCORING_QUEUE } from './queue.constants.js';
import { ScoringProcessor } from './scoring.processor.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: SCORING_QUEUE }),
    BullBoardModule.forFeature({
      name: SCORING_QUEUE,
      adapter: BullMQAdapter,
    }),
    TypeOrmModule.forFeature([UploadJob]),
  ],
  providers: [ScoringProcessor],
  exports: [BullModule],
})
export class QueueModule {}
