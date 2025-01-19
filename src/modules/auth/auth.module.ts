import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from 'src/databases/repositories/user.repository';
import { ApplicantRepository } from 'src/databases/repositories/applicant.repository';
import { JwtService } from '@nestjs/jwt';
import { CompanyRepository } from 'src/databases/repositories/company.repository';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    UserRepository,
    ApplicantRepository,
    CompanyRepository,
  ],
})
export class AuthModule {}
