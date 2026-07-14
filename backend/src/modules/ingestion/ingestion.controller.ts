import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IngestionService } from './ingestion.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UploadProjectDto } from './dto/upload-project.dto';
import { CONSTANTS } from 'src/common/constants';

const { MAX_UPLOAD_FILES } = CONSTANTS.ingestionController;

@Controller('projects')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  createFromGithub(@Body() dto: CreateProjectDto) {
    return this.ingestionService.createFromGithub(dto.repoUrl, dto.name);
  }

  @Post('upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FilesInterceptor('files', MAX_UPLOAD_FILES, { storage: memoryStorage() }),
  )
  createFromUpload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadProjectDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files were uploaded');
    }

    const loaded = files.map((file) => ({
      path: file.originalname,
      content: file.buffer.toString('utf-8'),
    }));

    return this.ingestionService.createFromUpload(loaded, dto.name);
  }
}
