import {
  Controller,
  Post,
  Get,
  Param,
  Headers,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { UploadsService } from './uploads.service.js';
import { ApiKeyGuard } from '../common/guards/api-key.guard.js';
import { CurrentOrganization } from '../common/decorators/current-organizaation.decorator.js';
import { Organization } from '../organizations/entities/organization.entity.js';

@Controller('uploads')
@UseGuards(ApiKeyGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentOrganization() organization: Organization,
  ) {
    if (!file) {
      throw new BadRequestException('Fichier manquant (champ "file")');
    }
    if (!idempotencyKey) {
      throw new BadRequestException('Header Idempotency-Key manquant');
    }

    const uploadJob = await this.uploadsService.createUpload(
      organization,
      file,
      idempotencyKey,
    );

    return {
      id: uploadJob.id,
      status: uploadJob.status,
    };
  }

  @Get(':id')
  async getStatus(
    @Param('id') id: string,
    @CurrentOrganization() organization: Organization,
  ) {
    const uploadJob = await this.uploadsService.findOne(organization, id);
    if (!uploadJob) {
      throw new NotFoundException('Job introuvable');
    }

    return {
      id: uploadJob.id,
      status: uploadJob.status,
      result: uploadJob.result,
      updatedAt: uploadJob.updatedAt,
    };
  }
}
