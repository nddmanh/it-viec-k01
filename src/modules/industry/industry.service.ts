import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UpsertIndustryDto } from './dto/upsert-industry.dto';
import { IndustryRepository } from 'src/databases/repositories/industry.repository';
import { IndustryQueriesDto } from './dto/industry-query.dto';
import { ILike } from 'typeorm';

@Injectable()
export class IndustryService {
  constructor(private readonly industryRepository: IndustryRepository) {}

  async create(body: UpsertIndustryDto) {
    const industryRec = await this.industryRepository.save(body);

    return {
      message: 'Create industry suuccessfully',
      result: industryRec,
    };
  }

  async update(id: number, body: UpsertIndustryDto) {
    const industryRec = await this.industryRepository.findOneBy({ id });

    // check tồn tại
    if (!industryRec) {
      throw new HttpException('Industry not found', HttpStatus.NOT_FOUND);
    }

    const industryUpdated = await this.industryRepository.save({
      ...industryRec,
      ...body,
    });

    return {
      message: 'Update industry suuccessfully',
      result: industryUpdated,
    };
  }

  async get(id: number) {
    const industryRec = await this.industryRepository.findOneBy({ id });

    return {
      message: 'Get detail industry suuccessfully',
      result: industryRec,
    };
  }

  async getAll(queries: IndustryQueriesDto) {
    const { name } = queries;

    const whereClause = name ? { name: ILike(`%${name}%`) } : {};
    const result = await this.industryRepository.find({
      where: whereClause,
    });

    return {
      message: 'Get detail industry suuccessfully',
      result,
    };
  }

  async delete(id: number) {
    await this.industryRepository.delete({ id });

    return {
      message: 'Delete industry suuccessfully',
    };
  }
}
