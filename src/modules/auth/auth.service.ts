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

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly applicantRepository: ApplicantRepository,
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

    return {
      message: 'Register user successfully',
    };
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
}
