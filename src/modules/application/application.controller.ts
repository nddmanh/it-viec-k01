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
import { ApplicationService } from './application.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { ROLE } from 'src/commons/enums/user.enum';
import { CreateApplicationDto } from './dto/create-application.dto';
import { GetCurrentUser } from 'src/commons/decorators/get-current-user.decorator';
import { User } from 'src/databases/entities/user.entity';

@ApiBearerAuth()
@Controller('application')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Roles(ROLE.APPLICANT)
  @Post()
  create(@Body() body: CreateApplicationDto, @GetCurrentUser() user: User) {
    return this.applicationService.create(body, user);
  }

  @Roles(ROLE.COMPANY)
  @Get('manuscipt/:manuscriptId')
  getAllByManuscript(
    @Param('manuscriptId') manuscriptId: number,
    @GetCurrentUser() user: User,
  ) {
    return this.applicationService.getAllByManuscript(manuscriptId, user);
  }
}
