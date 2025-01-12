import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from 'src/commons/decorators/is-strong-password.decorator';

export class RegisterUserDto {
  @ApiProperty({ example: 'user' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'User1234567@' })
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;
}
