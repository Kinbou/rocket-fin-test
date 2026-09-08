import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Organization } from '../organizations/entities/organization.entity.js';
import { ApiKey } from '../api-keys/entities/api-key.entity.js';
import { UploadJob } from '../uploads/entities/upload-job.entity.js';

const baseConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'rocketfin',
  password: process.env.DB_PASSWORD ?? 'rocketfin',
  database: process.env.DB_NAME ?? 'rocketfin',
  entities: [Organization, ApiKey, UploadJob],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

// Utilisée par l'app Nest au runtime — pas de migrations ici,
// l'app ne les exécute jamais elle-même.
export const typeOrmConfig: DataSourceOptions = baseConfig;

// Utilisé uniquement par le CLI TypeORM (migration:generate/run) et les scripts (seed).
export default new DataSource({
  ...baseConfig,
  migrations: ['src/migrations/*.ts'],
});
