import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dtos/register-user.dto';
import { UserRepository } from 'src/databases/repositories/user.repository';
import * as argon2 from 'argon2';
import { LOGIN_TYPE, ROLE } from 'src/commons/enums/user.enum';
import { ApplicantRepository } from 'src/databases/repositories/applicant.repository';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { User } from 'src/databases/entities/user.entity';
import { LoginGoogleDto } from './dtos/login-google.dto';
import { OAuth2Client } from 'google-auth-library';
import { RegisterCompanyDto } from './dtos/register-company.dto';
import { CompanyRepository } from 'src/databases/repositories/company.repository';
import { DataSource } from 'typeorm';
import { Company } from 'src/databases/entities/company.entity';
import { MailService } from '../mail/mail.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly applicantRepository: ApplicantRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    @InjectQueue('mail-queue') private mailQueue: Queue,
  ) {}

  async registerUser(body: RegisterUserDto) {
    const { username, email, password } = body;

    // check email exist
    const userRecord = await this.userRepository.findOneBy({ email: email });
    if (userRecord) {
      throw new HttpException('Email is exist', HttpStatus.BAD_REQUEST);
    }

    // Hash password
    const hashPassword = await argon2.hash(password);

    // Create new user
    const newUser = await this.userRepository.save({
      email,
      username,
      password: hashPassword,
      loginType: LOGIN_TYPE.EMAIL,
      role: ROLE.APPLICANT,
    });

    // Create new applicant by user
    await this.applicantRepository.save({
      userId: newUser.id,
    });

    // // Send mail here
    // await this.mailService.sendMail(
    //   email,
    //   'Welcome to IT VIEC',
    //   'welcome-applicant',
    //   {
    //     name: username,
    //     email: email,
    //   },
    // );

    // add job cho producer
    await this.mailQueue.add('send-mail-applicant', {
      name: username,
      email: email,
    });

    return {
      message: 'Register user successfully',
    };
  }

  async registerCompany(body: RegisterCompanyDto) {
    const {
      username,
      email,
      password,
      companyName,
      companyAddress,
      companyWebsite,
    } = body;

    // check email exist
    const userRecord = await this.userRepository.findOneBy({ email: email });
    if (userRecord) {
      throw new HttpException('Email is exist', HttpStatus.BAD_REQUEST);
    }

    // Hash password
    const hashPassword = await argon2.hash(password);

    const queryRunnner = this.dataSource.createQueryRunner();
    await queryRunnner.connect();

    await queryRunnner.startTransaction();
    try {
      // Create new user
      const newUser = await queryRunnner.manager.save(User, {
        email,
        username,
        password: hashPassword,
        loginType: LOGIN_TYPE.EMAIL,
        role: ROLE.COMPANY,
      });

      // Create new company by user
      await queryRunnner.manager.save(Company, {
        userId: newUser.id,
        name: companyName,
        location: companyAddress,
        website: companyWebsite,
      });

      await queryRunnner.commitTransaction();

      // // Send mail here
      // await this.mailService.sendMail(
      //   email,
      //   'Welcome your company to IT VIEC',
      //   'welcome-company',
      //   {
      //     name: username,
      //     email: email,
      //     company: companyName,
      //   },
      // );

      // add job cho producer
      await this.mailQueue.add('send-mail-company', {
        name: username,
        email: email,
        company: companyName,
      });
      return {
        message: 'Register user company successfully',
      };
    } catch (error) {
      console.log(error);
      await queryRunnner.rollbackTransaction();
    } finally {
      await queryRunnner.release();
    }
  }

  async login(body: LoginDto) {
    const { email, password } = body;

    // check user exist
    const userRecord = await this.userRepository.findOneBy({ email: email });
    if (!userRecord) {
      throw new HttpException(
        'Incorrect email address or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Compare password
    const isPasswordValid = await argon2.verify(userRecord.password, password);
    if (!isPasswordValid) {
      throw new HttpException(
        'Incorrect email address or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const payload = this.getPayload(userRecord);
    const { accessToken, refreshToken } = await this.signTokens(payload);

    return {
      message: 'Login user successfully',
      result: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refresh(body: RefreshTokenDto) {
    const { refreshToken } = body;

    //verify xem rt có hợp lệ k
    const payloadRefreshToken = await this.jwtService.verifyAsync(
      refreshToken,
      {
        secret: this.configService.get('jwtAuth').jwtRefreshTokenSecret,
      },
    );

    const userRecord = await this.userRepository.findOneBy({
      id: payloadRefreshToken.id,
    });
    if (!userRecord) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // gen ra cặp token mới
    const payload = this.getPayload(userRecord);
    const { accessToken, refreshToken: newRefresshToken } =
      await this.signTokens(payload);

    return {
      message: 'Refresh token successfully',
      result: {
        accessToken,
        refreshToken: newRefresshToken,
      },
    };
  }

  getPayload(user: User) {
    return {
      id: user.id,
      username: user.username,
      loginType: user.loginType,
      role: user.role,
    };
  }

  async signTokens(payload) {
    const payloadRefreshToken = {
      id: payload.id,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('jwtAuth').jwtTokenSecret,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payloadRefreshToken, {
      secret: this.configService.get('jwtAuth').jwtRefreshTokenSecret,
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async loginGoogle(body: LoginGoogleDto) {
    const { token } = body;

    const ggClientId = this.configService.get('google').clientId;
    const ggSecret = this.configService.get('google').clientSecret;

    const oAuth2Client = new OAuth2Client(ggClientId, ggSecret);
    const ggLoginTicket = await oAuth2Client.verifyIdToken({
      idToken: token,
      audience: ggClientId,
    });

    const { email_verified, email, name } = ggLoginTicket.getPayload();
    if (!email_verified) {
      throw new HttpException(
        'Email is not verified!: ' + email,
        HttpStatus.FORBIDDEN,
      );
    }

    // check user exist
    let userRecord = await this.userRepository.findOneBy({
      email: email,
      // loginType: LOGIN_TYPE.GOOGLE,
    });

    // check xem email này đã được dùng để đăng ký user chưa
    if (userRecord && userRecord.loginType === LOGIN_TYPE.EMAIL) {
      throw new HttpException(
        'Email use to register with email: ' + email,
        HttpStatus.FORBIDDEN,
      );
    }

    // Nếu không tồn tại thì tại user login with gg mới
    if (!userRecord) {
      userRecord = await this.userRepository.save({
        email,
        username: name,
        loginType: LOGIN_TYPE.GOOGLE,
      });

      await this.applicantRepository.save({
        userId: userRecord.id,
      });
    }

    const payload = this.getPayload(userRecord);
    const { accessToken, refreshToken } = await this.signTokens(payload);

    return {
      message: 'Login with gg successfully',
      result: {
        accessToken,
        refreshToken,
      },
    };
  }
}
