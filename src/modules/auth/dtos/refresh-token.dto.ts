import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzM2OTUxODI2LCJleHAiOjE3Mzc1NTY2MjZ9.xGfEWYuL_73Xs3OuJNQHH3mJ4Tss2ReZXGuRTxd0ojY',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
