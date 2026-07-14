import { IsOptional, IsString } from 'class-validator';

export class UploadProjectDto {
  @IsString()
  @IsOptional()
  name?: string;
}
