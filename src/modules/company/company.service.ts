import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyRepository } from 'src/databases/repositories/company.repository';
import { User } from 'src/databases/entities/user.entity';
import { StorageService } from '../storage/storage.service';
import { IndustryRepository } from 'src/databases/repositories/industry.repository';
import { ReviewCompanyDto } from './dto/review-company.dto';
import { CompanyReviewRepository } from 'src/databases/repositories/company-review.repository';
import { CompanyReviewQueryDto } from './dto/company-review-query.dto';

@Injectable()
export class CompanyService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly companyReviewRepository: CompanyReviewRepository,
    private readonly industryRepository: IndustryRepository,
    private readonly storageService: StorageService,
  ) {}

  async update(id: number, body: UpdateCompanyDto, user: User) {
    // Validate chỉ có hr trong company mới update được company
    const companyRec = await this.companyRepository.findOneBy({
      id,
      userId: user.id,
    });

    if (!companyRec) {
      throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
    }

    // validate path logo
    if (body.logo) {
      await this.storageService.getSignedUrl(body.logo);
    }

    // Validate industry
    const industryRec = await this.industryRepository.findOneBy({
      id: body.industryId,
    });
    if (!industryRec) {
      throw new HttpException(
        'industry not found with id = ' + body.industryId,
        HttpStatus.NOT_FOUND,
      );
    }

    const companyUpdated = await this.companyRepository.save({
      ...companyRec,
      ...body,
    });

    if (companyUpdated.logo) {
      companyUpdated.logo = await this.storageService.getSignedUrl(
        companyUpdated.logo,
      );
    }

    // Delete ảnh cũ nếu thay đổi
    if (companyRec.logo !== body.logo) {
      await this.storageService.delete(companyRec.logo);
    }

    return {
      message: 'Update company suuccessfully',
      result: companyUpdated,
    };
  }

  async createReview(body: ReviewCompanyDto, user: User) {
    const companyReview = await this.companyReviewRepository.save({
      ...body,
      userId: user.id,
    });

    return {
      message: 'Review company suuccessfully',
      result: companyReview,
    };
  }

  async getReview(companyId: number, queries: CompanyReviewQueryDto) {
    const { limit, cursor } = queries;

    const total = await this.companyReviewRepository.count({
      where: { companyId },
    });

    const queryBuilder = await this.companyReviewRepository
      .createQueryBuilder('review')
      .where('review.companyId = :companyId', { companyId })
      .orderBy('review.createdAt', 'DESC')
      .take(limit + 1);

    if (cursor) {
      queryBuilder.andWhere('review.id < :cursor', { cursor });
    }

    const results = await queryBuilder.getMany();

    let next = null;
    const hasNextPage = results.length > limit;
    if (hasNextPage) {
      results.pop();
      next = results[results.length - 1].id;
    }

    return {
      message: 'Get reviews company suuccessfully',
      result: {
        data: results,
        pagination: {
          limit,
          next,
          total,
        },
      },
    };
  }
}
