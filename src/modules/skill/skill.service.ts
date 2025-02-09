import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UpsertSkillDto } from './dto/upsert-skill.dto';
import { SkillRepository } from 'src/databases/repositories/skill.repository';
import { SkillQueriesDto } from './dto/skill-query.dto';
import { ILike } from 'typeorm';

@Injectable()
export class SkillService {
  constructor(private readonly skillRepository: SkillRepository) {}

  async create(body: UpsertSkillDto) {
    const skillRec = await this.skillRepository.save(body);

    return {
      message: 'Create skill suuccessfully',
      result: skillRec,
    };
  }

  async update(id: number, body: UpsertSkillDto) {
    const skillRec = await this.skillRepository.findOneBy({ id });

    // check tồn tại
    if (!skillRec) {
      throw new HttpException('Skill not found', HttpStatus.NOT_FOUND);
    }

    const skillUpdated = await this.skillRepository.save({
      ...skillRec,
      ...body,
    });

    return {
      message: 'Update skill suuccessfully',
      result: skillUpdated,
    };
  }

  async get(id: number) {
    const skillRec = await this.skillRepository.findOneBy({ id });

    return {
      message: 'Get detail skill suuccessfully',
      result: skillRec,
    };
  }

  async getAll(queries: SkillQueriesDto) {
    const { name } = queries;

    const whereClause = name ? { name: ILike(`%${name}%`) } : {};
    const result = await this.skillRepository.find({
      where: whereClause,
    });

    return {
      message: 'Get detail skill suuccessfully',
      result,
    };
  }

  async delete(id: number) {
    await this.skillRepository.delete({ id });

    return {
      message: 'Delete skill suuccessfully',
    };
  }
}
