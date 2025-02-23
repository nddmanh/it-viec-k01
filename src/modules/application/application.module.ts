import { Module } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { ApplicationRepository } from 'src/databases/repositories/application.repository';
import { ManuscriptRepository } from 'src/databases/repositories/manuscript.repository';
import { StorageService } from '../storage/storage.service';
import { ApplicantRepository } from 'src/databases/repositories/applicant.repository';

@Module({
  controllers: [ApplicationController],
  providers: [
    ApplicationService,
    ApplicationRepository,
    ManuscriptRepository,
    StorageService,
    ApplicantRepository,
  ],
})
export class ApplicationModule {}
