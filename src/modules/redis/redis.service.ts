import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.provider';
import { Redis as RedisClient } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClient,
  ) {}

  async setKey(key: string, value: string) {
    await this.redisClient.set(key, value, 'EX', 10 * 60);
  }

  async getKey(key: string) {
    return await this.redisClient.get(key);
  }
}
