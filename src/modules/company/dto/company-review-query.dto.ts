import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class CompanyReviewQueryDto {
  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit: number = 10;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  cursor: number;
}
