import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ChunkVectorRepository } from './chunk-vector.repository';

@Global()
@Module({
  imports: [],
  providers: [PrismaService, ChunkVectorRepository],
  exports: [PrismaService, ChunkVectorRepository],
})
export class PrismaModule {}
