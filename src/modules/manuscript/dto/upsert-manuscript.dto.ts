import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { COMPANY_ADDRESS } from 'src/commons/enums/company.enum';
import {
  APPLICANT_LEVEL,
  WORKING_MODEL,
} from 'src/commons/enums/manuscript.enum';

export class UpsertManuscriptDto {
  @ApiProperty()
  @IsNumber({}, { each: true })
  @IsOptional()
  skillIds: number[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  summary: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  requirement: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  quantity: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  status: string;

  @ApiProperty({
    example: COMPANY_ADDRESS.HA_NOI,
    enum: COMPANY_ADDRESS,
  })
  @IsEnum(COMPANY_ADDRESS)
  @IsOptional()
  location: COMPANY_ADDRESS;

  @ApiProperty({
    example: APPLICANT_LEVEL.FRESHER,
    enum: APPLICANT_LEVEL,
  })
  @IsEnum(APPLICANT_LEVEL)
  @IsOptional()
  level: APPLICANT_LEVEL;

  @ApiProperty({
    example: WORKING_MODEL.AT_OFFICE,
    enum: WORKING_MODEL,
  })
  @IsEnum(WORKING_MODEL)
  @IsOptional()
  workingModel: WORKING_MODEL;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  minSalary: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  maxSalary: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  currencySalary: string;

  @ApiProperty()
  @IsDate()
  @IsOptional()
  // convert string date to date
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @ApiProperty()
  @IsDate()
  @IsOptional()
  // convert string date to date
  @Transform(({ value }) => new Date(value))
  endDate: Date;
}
