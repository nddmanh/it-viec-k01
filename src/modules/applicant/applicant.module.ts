import { Module } from '@nestjs/common';
import { ApplicantService } from './applicant.service';
import { ApplicantController } from './applicant.controller';
import { ApplicantRepository } from 'src/databases/repositories/applicant.repository';
import { StorageService } from '../storage/storage.service';
import { ApplicantSkillRepository } from 'src/databases/repositories/applicant-skill.repository';

@Module({
  controllers: [ApplicantController],
  providers: [
    ApplicantService,
    ApplicantRepository,
    StorageService,
    ApplicantSkillRepository,
  ],
})
export class ApplicantModule {}
