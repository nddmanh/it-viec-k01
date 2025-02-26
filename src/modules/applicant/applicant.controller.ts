import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApplicantService } from './applicant.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { ROLE } from 'src/commons/enums/user.enum';
import { GetCurrentUser } from 'src/commons/decorators/get-current-user.decorator';
import { User } from 'src/databases/entities/user.entity';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { UpsertAppliantSkilDto } from './dto/upsert-applicant-skill.dto';

@ApiBearerAuth()
@Controller('applicant')
export class ApplicantController {
  constructor(private readonly applicantService: ApplicantService) {}

  @Roles(ROLE.APPLICANT)
  @Put()
  create(@Body() body: UpdateApplicantDto, @GetCurrentUser() user: User) {
    return this.applicantService.update(body, user);
  }

  @Roles(ROLE.APPLICANT)
  @Post('skills')
  createSkill(
    @Body() body: UpsertAppliantSkilDto,
    @GetCurrentUser() user: User,
  ) {
    return this.applicantService.createSkill(body, user);
  }

  @Roles(ROLE.APPLICANT)
  @Put('skills/:id')
  updateSkill(
    @Param('id') id: number,
    @Body() body: UpsertAppliantSkilDto,
    @GetCurrentUser() user: User,
  ) {
    return this.applicantService.updateSkill(id, body, user);
  }

  @Roles(ROLE.APPLICANT)
  @Get('skills')
  getSkills(@GetCurrentUser() user: User) {
    return this.applicantService.getSkills(user);
  }
}
