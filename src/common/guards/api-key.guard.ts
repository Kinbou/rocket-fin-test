import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'node:crypto';
import { ApiKey } from '../../api-keys/entities/api-key.entity.js';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawKey = request.headers['x-api-key'];

    if (!rawKey || typeof rawKey !== 'string') {
      throw new UnauthorizedException('Clé API manquante (header x-api-key)');
    }

    const hashedKey = createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await this.apiKeyRepository.findOne({
      where: { hashedKey, isActive: true },
      relations: { organization: true },
    });

    if (!apiKey) {
      throw new UnauthorizedException('Clé API invalide');
    }

    request.organization = apiKey.organization;
    return true;
  }
}
