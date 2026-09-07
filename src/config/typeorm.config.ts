import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Organization } from '../organizations/entities/organization.entity.js';
import { ApiKey } from '../api-keys/entities/api-key.entity.js';
import { UploadJob } from '../uploads/entities/upload-job.entity.js';

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'rocketfin',
  password: process.env.DB_PASSWORD ?? 'rocketfin',
  database: process.env.DB_NAME ?? 'rocketfin',
  entities: [Organization, ApiKey, UploadJob],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'development',
};

export default new DataSource(typeOrmConfig);
