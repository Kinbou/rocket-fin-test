import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UploadJob } from './entities/upload-job.entity.js';
import { UploadsController } from './uploads.controller.js';
import { UploadsService } from './uploads.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UploadJob])],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
