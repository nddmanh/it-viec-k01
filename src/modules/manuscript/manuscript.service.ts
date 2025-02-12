import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ManuscriptRepository } from 'src/databases/repositories/manuscript.repository';
import { User } from 'src/databases/entities/user.entity';
import { CompanyRepository } from 'src/databases/repositories/company.repository';
import { Manuscript } from 'src/databases/entities/manuscript.entity';
import { UpsertManuscriptDto } from './dto/upsert-manuscript.dto';
import { ManuscriptSkill } from 'src/databases/entities/manuscript-skill.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class ManuscriptService {
  constructor(
    private readonly manuscriptRepository: ManuscriptRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(body: UpsertManuscriptDto, user: User) {
    // insert lên 2 bảng => transaction
    // tìm company
    const companyRec = await this.companyRepository.findOneBy({
      userId: user.id,
    });

    const { skillIds } = body;
    delete body.skillIds; // xóa đi vì manuscript không có trường này

    const queryRunnner = this.dataSource.createQueryRunner();
    await queryRunnner.connect();

    await queryRunnner.startTransaction();
    try {
      const manuscriptRec = await queryRunnner.manager.save(Manuscript, {
        ...body,
        companyId: companyRec.id,
      });

      const manuscriptSkills = skillIds.map((skillId) => ({
        manuscriptId: manuscriptRec.id,
        skillId,
      }));

      await queryRunnner.manager.save(ManuscriptSkill, manuscriptSkills);

      await queryRunnner.commitTransaction();

      return {
        message: 'Create manuscript suuccessfully',
        result: manuscriptRec,
      };
    } catch (error) {
      await queryRunnner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunnner.release();
    }
  }

  async update(id: number, body: UpsertManuscriptDto, user: User) {
    return {
      message: 'Update manuscript suuccessfully',
      result: 'manuscriptUpdated',
    };
  }

  // thực hiện xóa mềm (soft delete): đánh dấu bản ghi là đã xóa chứ không xóa hẳn trong db
  async delete(id: number, user: User) {
    // Validate hr có trong công ty không
    const companyRec = await this.companyRepository.findOneBy({
      userId: user.id,
    });

    const manuscriptRec = await this.manuscriptRepository.findOneBy({
      id,
    });

    // Check xem công ty của user có phải là công ty của tin tuyển dụng
    if (companyRec.id !== manuscriptRec.companyId) {
      throw new HttpException('User FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    await this.manuscriptRepository.softDelete(id);

    return {
      message: 'Success',
    };
  }
}
