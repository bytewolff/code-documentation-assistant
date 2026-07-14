import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ChunkVectorRepository } from 'src/common/prisma/chunk-vector.repository';
import { AiService } from 'src/modules/ai/ai.service';
import { CONSTANTS } from 'src/common/constants';

const { TOP_K } = CONSTANTS.chatService;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly chunkVectorRepository: ChunkVectorRepository,
  ) {}

  async ask(projectId: string, question: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (project.status !== 'ready') {
      throw new ConflictException(
        `Project ${projectId} is not ready for chat (status: ${project.status})`,
      );
    }

    const [questionEmbedding] = await this.aiService.createEmbeddings(
      [question],
      'query',
    );

    const matches = await this.chunkVectorRepository.similaritySearch(
      projectId,
      questionEmbedding,
      TOP_K,
    );

    const answer = await this.aiService.answer(
      question,
      matches.map((match) => ({
        filePath: match.filePath,
        content: match.content,
      })),
    );

    return {
      answer,
      sources: matches.map((match) => ({
        filePath: match.filePath,
        startLine: match.startLine,
        endLine: match.endLine,
      })),
    };
  }
}
