import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from './prisma.service';
import { NewChunk, SimilarChunk } from './chunk-vector.types';

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

@Injectable()
export class ChunkVectorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async insertChunks(projectId: string, chunks: NewChunk[]): Promise<void> {
    await Promise.all(
      chunks.map((chunk) => {
        const id = randomUUID();
        const vector = toVectorLiteral(chunk.embedding);
        return this.prisma.$executeRaw`
          INSERT INTO "Chunk" (id, "projectId", "filePath", content, "startLine", "endLine", embedding, "createdAt")
          VALUES (${id}, ${projectId}, ${chunk.filePath}, ${chunk.content}, ${chunk.startLine}, ${chunk.endLine}, ${vector}::vector, now())
        `;
      }),
    );
  }

  async similaritySearch(
    projectId: string,
    embedding: number[],
    topK: number,
  ): Promise<SimilarChunk[]> {
    const vector = toVectorLiteral(embedding);

    return this.prisma.$queryRaw<SimilarChunk[]>`
      SELECT id, "filePath", content, "startLine", "endLine",
             1 - (embedding <=> ${vector}::vector) AS similarity
      FROM "Chunk"
      WHERE "projectId" = ${projectId}
      ORDER BY embedding <=> ${vector}::vector
      LIMIT ${topK}
    `;
  }
}
