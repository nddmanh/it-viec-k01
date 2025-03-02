import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { CompanyRepository } from 'src/databases/repositories/company.repository';
import { StorageService } from '../storage/storage.service';
import { IndustryRepository } from 'src/databases/repositories/industry.repository';
import { CompanyReviewRepository } from 'src/databases/repositories/company-review.repository';

@Module({
  controllers: [CompanyController],
  providers: [
    CompanyService,
    CompanyRepository,
    StorageService,
    IndustryRepository,
    CompanyReviewRepository,
  ],
})
export class CompanyModule {}
