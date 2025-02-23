import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ManuscriptRepository } from 'src/databases/repositories/manuscript.repository';
import { User } from 'src/databases/entities/user.entity';
import { CompanyRepository } from 'src/databases/repositories/company.repository';
import { Manuscript } from 'src/databases/entities/manuscript.entity';
import { UpsertManuscriptDto } from './dto/upsert-manuscript.dto';
import { ManuscriptSkill } from 'src/databases/entities/manuscript-skill.entity';
import { DataSource } from 'typeorm';
import { ManuscriptQueriesDto } from './dto/manuscript-queries.dto';
import { convertKeySortManuscript } from 'src/commons/utils/helper';
import { ManuscriptSkillRepository } from 'src/databases/repositories/manuscript-skill.repository';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ManuscriptService {
  constructor(
    private readonly manuscriptRepository: ManuscriptRepository,
    private readonly manuscriptSkillRepository: ManuscriptSkillRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
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
    const companyRec = await this.companyRepository.findOneBy({
      userId: user.id,
    });

    const manuscriptRec = await this.manuscriptRepository.findOne({
      where: {
        id,
      },
    });

    if (!manuscriptRec) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    if (companyRec.id !== manuscriptRec.companyId) {
      throw new HttpException('User FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    const { skillIds } = body;
    delete body.skillIds;

    // Update Manuscript
    const updatedManuscript = await this.manuscriptRepository.save({
      ...manuscriptRec,
      ...body,
    });

    // Update Manuscript skills
    // Xóa đi những manuscript cũ
    await this.manuscriptSkillRepository.delete({ manuscriptId: id });

    // Tạo lại manuscript mới
    const manuscriptSkills = skillIds.map((skillId) => ({
      manuscriptId: manuscriptRec.id,
      skillId,
    }));

    await this.manuscriptSkillRepository.save(manuscriptSkills);

    // Xóa data trong redis vì dữ liệu bị thay đổi
    await this.redisService.setKey('manu' + id, '');

    return {
      message: 'Update manuscript suuccessfully',
      result: updatedManuscript,
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
    // Xóa data trong redis vì dữ liệu bị thay đổi
    await this.redisService.setKey('manu' + id, '');

    return {
      message: 'Success',
    };
  }

  async getAll(queries: ManuscriptQueriesDto) {
    const {
      page,
      limit,
      keyword,
      companyAddress,
      companyTypes,
      levels,
      workingModels,
      industryIds,
      maxSalary,
      minSalary,
      sort,
    } = queries;

    const skip = (page - 1) * limit;

    const queryBuilder = this.manuscriptRepository
      .createQueryBuilder('manuscript')
      .leftJoin('manuscript.company', 'c')
      .leftJoin('manuscript.manuscriptSkills', 'm')
      .leftJoin('m.skill', 's')
      .select([
        'manuscript.id AS "id"',
        'manuscript.title AS "title"',
        'manuscript.minSalary AS "minSalary"',
        'manuscript.maxSalary AS "maxSalary"',
        'manuscript.summary AS "summary"',
        'manuscript.level AS "level"',
        'manuscript.workingModel AS "workingModel"',
        'manuscript.createdAt AS "createdAt"',
        'c.id AS "companyId"',
        'c.name AS "companyName"',
        'c.location AS "companyAddress"',
        'c.companySize AS "companySize"',
        'c.companyType AS "companyType"',
        'c.industry AS "companyIndustry"',
        'c.logo AS "companyLogo"',
        "JSON_AGG(json_build_object('id', s.id, 'name', s.name)) AS manuscriptSkills",
      ])
      .groupBy('manuscript.id, c.id');

    if (companyAddress) {
      queryBuilder.andWhere('c.location = :address', {
        address: companyAddress,
      });
    }

    if (companyTypes) {
      queryBuilder.andWhere('c.companyType IN (:...types)', {
        types: companyTypes,
      });
    }

    if (levels) {
      queryBuilder.andWhere('manuscript.level IN (:...levels)', {
        levels: levels,
      });
    }

    if (workingModels) {
      queryBuilder.andWhere('manuscript.workingModel IN (:...workingModels)', {
        workingModels: workingModels,
      });
    }

    if (industryIds) {
      queryBuilder.andWhere('c.industry IN (:...industryIds)', {
        industryIds: industryIds,
      });
    }

    if (minSalary && maxSalary) {
      queryBuilder
        .andWhere('manuscript.minSalary >= :minSalary', {
          minSalary: minSalary,
        })
        .andWhere('manuscript.maxSalary <= :maxSalary', {
          maxSalary: maxSalary,
        });
    }

    if (keyword) {
      queryBuilder
        .andWhere('s.name ILIKE :keyword', {
          keyword: `%${keyword}%`,
        })
        .orWhere('manuscript.title ILIKE :keyword', {
          keyword: `%${keyword}%`,
        })
        .orWhere('manuscript.summary ILIKE :keyword', {
          keyword: `%${keyword}%`,
        })
        .orWhere('c.name ILIKE :keyword', {
          keyword: `%${keyword}%`,
        });
    }

    if (sort) {
      const order = convertKeySortManuscript(sort);
      for (const key of Object.keys(order)) {
        queryBuilder.addOrderBy(key, order[key]);
      }
    } else {
      queryBuilder.addOrderBy('manuscript.createdAt', 'DESC')
    }

    queryBuilder.limit(limit).offset(skip);

    const data = await queryBuilder.getRawMany();
    const total = await queryBuilder.getCount();

    return {
      message: 'Get all manuscripts',
      result: {
        total,
        page,
        limit,
        data,
      },
    };
  }

  async get(id) {
    const manuKey = 'manu' + id;

    // Step 1: get manuscriptRec từ redis
    console.log('step 1');

    const manuscript = await this.redisService.getKey(manuKey);
    let manuscriptRec: Manuscript;

    // Step 2: check manuscript redis is null
    if (!manuscript) {
      console.log('step 2');

      // Step 3: nếu ko có
      // Step 3.1: vào db lấy
      manuscriptRec = await this.manuscriptRepository.findOne({
        where: {
          id,
        },
      });

      console.log('step 3');

      if (!manuscriptRec) {
        throw new HttpException('Not found', HttpStatus.NOT_FOUND);
      }

      // Step 3.2: nếu ko có thì vào db lấy
      await this.redisService.setKey(manuKey, JSON.stringify(manuscriptRec));
      console.log('step 3.2');
    } else {
      console.log('step 4');

      manuscriptRec = JSON.parse(manuscript);
    }

    console.log('Done!');

    // nếu có trong redis thì trả về
    return {
      message: 'get manuscript suuccessfully',
      result: manuscriptRec,
    };
  }
}
