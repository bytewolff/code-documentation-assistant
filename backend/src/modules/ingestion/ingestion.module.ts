import { Module } from '@nestjs/common';
import { AiModule } from 'src/modules/ai/ai.module';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { ChunkingService } from './chunking.service';

@Module({
  imports: [AiModule],
  controllers: [IngestionController],
  providers: [IngestionService, ChunkingService],
})
export class IngestionModule {}
