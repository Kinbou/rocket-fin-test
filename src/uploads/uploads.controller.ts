import {
  Controller,
  Post,
  Get,
  Param,
  Headers,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { UploadsService } from './uploads.service.js';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    if (!file) {
      throw new BadRequestException('Fichier manquant (champ "file")');
    }
    if (!idempotencyKey) {
      throw new BadRequestException('Header Idempotency-Key manquant');
    }

    // TODO : remplacer par la vraie organisation une fois le guard clé API en place
    const fakeOrganization = { id: 'TODO' } as any;

    const uploadJob = await this.uploadsService.createUpload(
      fakeOrganization,
      file,
      idempotencyKey,
    );

    return {
      id: uploadJob.id,
      status: uploadJob.status,
    };
  }

  @Get(':id')
  async getStatus(@Param('id') id: string) {
    // TODO : filtrer par organisation une fois le guard en place
    const fakeOrganization = { id: 'TODO' } as any;

    const uploadJob = await this.uploadsService.findOne(fakeOrganization, id);
    if (!uploadJob) {
      throw new NotFoundException('Job introuvable');
    }

    return {
      id: uploadJob.id,
      status: uploadJob.status,
      updatedAt: uploadJob.updatedAt,
    };
  }
}
