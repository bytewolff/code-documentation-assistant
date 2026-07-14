import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateProjectDto {
  @IsUrl({ require_protocol: true })
  @IsNotEmpty()
  repoUrl: string;

  @IsString()
  @IsOptional()
  name?: string;
}
