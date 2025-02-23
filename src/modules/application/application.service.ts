import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationRepository } from 'src/databases/repositories/application.repository';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ManuscriptRepository } from 'src/databases/repositories/manuscript.repository';
import { StorageService } from '../storage/storage.service';
import { User } from 'src/databases/entities/user.entity';
import { ApplicantRepository } from 'src/databases/repositories/applicant.repository';

@Injectable()
export class ApplicationService {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly manuscriptRepository: ManuscriptRepository,
    private readonly applicantRepository: ApplicantRepository,
    private readonly storageService: StorageService,
  ) {}

  async create(body: CreateApplicationDto, user: User) {
    const manuscriptRec = await this.manuscriptRepository.findOne({
      where: {
        id: body.manuscriptId,
      },
    });

    if (!manuscriptRec) {
      throw new HttpException('Manuscript Not found', HttpStatus.NOT_FOUND);
    }

    const applicant = await this.applicantRepository.findOne({
      where: {
        userId: user.id,
      },
    });

    // validate file resume
    if (body.resume) {
      await this.storageService.getSignedUrl(body.resume);
    }

    const payload = {
      ...body,
      applicantId: applicant.id,
    };

    const applicationRec = await this.applicationRepository.save(payload);

    return {
      message: 'Create application suuccessfully',
      result: applicationRec,
    };
  }

  async getAllByManuscript(manuscriptId: number, user: User) {
    const manuscriptRec = await this.manuscriptRepository.findOne({
      where: {
        id: manuscriptId,
      },
      relations: ['company'],
    });

    if (!manuscriptRec) {
      throw new HttpException('Manuscript Not found', HttpStatus.NOT_FOUND);
    }
    if (manuscriptRec.company.userId !== user.id) {
      throw new HttpException('Company Not Access', HttpStatus.FORBIDDEN);
    }

    const result = await this.applicationRepository.find({
      where: {
        manuscriptId,
      },
      relations: ['applicant'],
    });

    return {
      message: 'Get detail application suuccessfully',
      result,
    };
  }
}
