import { ApiProperty } from '@nestjs/swagger';

export class UploadedFileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
