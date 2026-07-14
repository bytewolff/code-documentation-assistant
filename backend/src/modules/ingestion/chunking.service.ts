import { Injectable } from '@nestjs/common';
import { CONSTANTS } from 'src/common/constants';
import { Chunk } from './ingestion.types';

const { CHUNK_SIZE, CHUNK_OVERLAP } = CONSTANTS.chunkingService;

@Injectable()
export class ChunkingService {
  chunkFile(content: string): Chunk[] {
    const lines = content.split('\n');
    const chunks: Chunk[] = [];

    const step = CHUNK_SIZE - CHUNK_OVERLAP;
    for (let start = 0; start < lines.length; start += step) {
      const end = Math.min(start + CHUNK_SIZE, lines.length);
      const chunkLines = lines.slice(start, end);
      const chunkContent = chunkLines.join('\n');

      if (chunkContent.trim().length > 0) {
        chunks.push({
          content: chunkContent,
          startLine: start + 1,
          endLine: end,
        });
      }

      if (end === lines.length) {
        break;
      }
    }

    return chunks;
  }
}
