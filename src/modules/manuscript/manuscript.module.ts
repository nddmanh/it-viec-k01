import { Module } from '@nestjs/common';
import { ManuscriptService } from './manuscript.service';
import { ManuscriptController } from './manuscript.controller';
import { ManuscriptRepository } from 'src/databases/repositories/manuscript.repository';
import { CompanyRepository } from 'src/databases/repositories/company.repository';
import { ManuscriptSkillRepository } from 'src/databases/repositories/manuscript-skill.repository';
import { RedisService } from '../redis/redis.service';
import { ManuscriptViewRepository } from 'src/databases/repositories/manuscript-view.repository';
import { ManuscriptSaveRepository } from 'src/databases/repositories/manuscript-save.repository';

@Module({
  controllers: [ManuscriptController],
  providers: [
    ManuscriptService,
    ManuscriptRepository,
    CompanyRepository,
    ManuscriptSkillRepository,
    ManuscriptViewRepository,
    RedisService,
    ManuscriptSaveRepository,
  ],
})
export class ManuscriptModule {}
