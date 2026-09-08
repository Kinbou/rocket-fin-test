import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { typeOrmConfig } from './config/typeorm.config.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UploadsModule } from './uploads/uploads.module.js';

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig), UploadsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
