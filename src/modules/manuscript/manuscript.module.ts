import { Module } from '@nestjs/common';
import { ManuscriptService } from './manuscript.service';
import { ManuscriptController } from './manuscript.controller';
import { ManuscriptRepository } from 'src/databases/repositories/manuscript.repository';
import { CompanyRepository } from 'src/databases/repositories/company.repository';

@Module({
  controllers: [ManuscriptController],
  providers: [ManuscriptService, ManuscriptRepository, CompanyRepository],
})
export class ManuscriptModule {}
