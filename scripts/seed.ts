import 'dotenv/config';
import { randomBytes, createHash } from 'node:crypto';
import dataSource from '../src/config/typeorm.config.js';
import { Organization } from '../src/organizations/entities/organization.entity.js';
import { ApiKey } from '../src/api-keys/entities/api-key.entity.js';

async function seed() {
  await dataSource.initialize();

  const orgRepo = dataSource.getRepository(Organization);
  const apiKeyRepo = dataSource.getRepository(ApiKey);

  const organization = await orgRepo.save(orgRepo.create({ name: 'Demo Org' }));

  const rawKey = randomBytes(24).toString('hex');
  const hashedKey = createHash('sha256').update(rawKey).digest('hex');

  await apiKeyRepo.save(apiKeyRepo.create({ hashedKey, organization }));

  console.log('Organisation créée :', organization.id);
  console.log('Clé API (à conserver, non récupérable ensuite) :', rawKey);

  await dataSource.destroy();
}

seed();
