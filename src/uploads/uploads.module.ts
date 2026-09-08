import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UploadJob } from './entities/upload-job.entity.js';
import { UploadsController } from './uploads.controller.js';
import { UploadsService } from './uploads.service.js';
import { ApiKeyGuard } from '../common/guards/api-key.guard.js';
import { ApiKey } from '../api-keys/entities/api-key.entity.js';
import { QueueModule } from '../queue/queue.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([UploadJob, ApiKey]), QueueModule],
  controllers: [UploadsController],
  providers: [UploadsService, ApiKeyGuard],
})
export class UploadsModule {}
