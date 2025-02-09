import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Public } from 'src/commons/decorators/public.decorator';
import { StorageService } from './storage.service';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFileDto } from './dto/upload-file.dto';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Public()
  @Post('upload/image')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    type: UploadedFileDto,
  })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    // Validate file type
    const validMineTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validMineTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only images are allowed',
      );
    }

    // Validate size (<5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('File size exceedss the 5MB');
    }

    const filePath = `/images/${Date.now()}-${file.originalname}`;
    const uploadResult = await this.storageService.uploadFile(
      filePath,
      file.buffer,
    );
    const publicUrl = await this.storageService.getSignedUrl(uploadResult.path);

    return {
      message: 'Image upload successfully',
      result: {
        publicUrl,
        path: uploadResult.path,
      },
    };
  }

  @Public()
  @Post('upload/cv')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    type: UploadedFileDto,
  })
  async uploadCV(@UploadedFile() file: Express.Multer.File) {
    // Validate file type
    const [, fileType] = file.originalname.split('.');
    const validFileTypes = ['pdf', 'doc', 'docx'];
    if (!validFileTypes.includes(fileType)) {
      throw new BadRequestException(
        'Invalid file type. Only images are allowed',
      );
    }

    // Validate size (<3MB)
    const maxSizeBytes = 3 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('File size exceedss the 3MB');
    }

    const filePath = `/cvs/${Date.now()}-${file.originalname}`;
    const uploadResult = await this.storageService.uploadFile(
      filePath,
      file.buffer,
    );
    const publicUrl = await this.storageService.getSignedUrl(uploadResult.path);

    return {
      message: 'CV upload successfully',
      result: {
        publicUrl,
        path: uploadResult.path,
      },
    };
  }

  @Public()
  @Delete('delete')
  async deleteFile(@Body() body: { key: string }) {
    const result = await this.storageService.delete(body.key);
    console.log(result);

    return {
      message: 'Delete file successfully',
    };
  }

  // So sánh sự khác nhau giữa private và public bucket:
  // Public: https://mtaayzxdztkdkoxrlvhg.supabase.co/storage/v1/object/public/it-viec-public//cnpm2.jpg
  // Private: dù có biết đc đường dẫn file, nhưng vẫn không thể truy cập được
  // https://mtaayzxdztkdkoxrlvhg.supabase.co/storage/v1/object/sign/it-viec/cnpm2%20(2).jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJpdC12aWVjL2NucG0yICgyKS5qcGciLCJpYXQiOjE3Mzg3Njc5OTUsImV4cCI6MTczOTM3Mjc5NX0.zQUe0hUkjH-EaFxB7a1SJkzHymsYkrKcFvsVylAgZ70
}
