import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { User } from 'src/databases/entities/user.entity';
import { ApplicantRepository } from 'src/databases/repositories/applicant.repository';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { UpsertAppliantSkilDto } from './dto/upsert-applicant-skill.dto';
import { ApplicantSkillRepository } from 'src/databases/repositories/applicant-skill.repository';

@Injectable()
export class ApplicantService {
  constructor(
    private readonly applicantRepository: ApplicantRepository,
    private readonly applicantSkillRepository: ApplicantSkillRepository,
    private readonly storageService: StorageService,
  ) {}

  async update(body: UpdateApplicantDto, user: User) {
    const applicantRec = await this.applicantRepository.findOne({
      where: {
        userId: user.id,
      },
    });

    // validate avatar
    if (body.avatar) {
      await this.storageService.getSignedUrl(body.avatar);
    }

    const updatedApplicantRec = await this.applicantRepository.save({
      ...applicantRec,
      ...body,
    });

    return {
      message: 'Update applicant suuccessfully',
      result: updatedApplicantRec,
    };
  }

  async createSkill(body: UpsertAppliantSkilDto, user: User) {
    const applicantRec = await this.applicantRepository.findOne({
      where: {
        userId: user.id,
      },
    });

    const applicantSkillRec = await this.applicantSkillRepository.save({
      ...body,
      applicantId: applicantRec.id,
    });

    return {
      message: 'create applicant skill suuccessfully',
      result: applicantSkillRec,
    };
  }

  async updateSkill(id: number, body: UpsertAppliantSkilDto, user: User) {
    const applicantSkillRec = await this.applicantSkillRepository.findOneBy({
      id,
    });

    const updatedApplicantSkillRec = await this.applicantSkillRepository.save({
      ...applicantSkillRec,
      ...body,
    });

    return {
      message: 'update applicant skill suuccessfully',
      result: updatedApplicantSkillRec,
    };
  }

  async getSkills(user: User) {
    const applicantRec = await this.applicantRepository.findOne({
      where: {
        userId: user.id,
      },
    });

    const applicantSkillRec = await this.applicantSkillRepository.find({
      where: {
        applicantId: applicantRec.id,
      },
    });

    return {
      message: 'get applicant skills suuccessfully',
      result: applicantSkillRec,
    };
  }
}
