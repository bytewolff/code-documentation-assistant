import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ChunkVectorRepository } from 'src/common/prisma/chunk-vector.repository';
import { NewChunk } from 'src/common/prisma/chunk-vector.types';
import { AiService } from 'src/modules/ai/ai.service';
import { CONSTANTS } from 'src/common/constants';
import { PROJECT_STATUS_EVENT } from 'src/common/events/project-status.event';
import { ChunkingService } from './chunking.service';
import { isIngestibleFile } from './file-filter';
import { loadGithubRepo, parseGithubUrl } from './github-loader';
import { LoadedFile } from './ingestion.types';

const { EMBEDDING_INSERT_BATCH_SIZE } = CONSTANTS.ingestionService;

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly chunkingService: ChunkingService,
    private readonly chunkVectorRepository: ChunkVectorRepository,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createFromGithub(repoUrl: string, name?: string) {
    const { owner, repo } = parseGithubUrl(repoUrl);

    const project = await this.prisma.project.create({
      data: {
        name: name ?? `${owner}/${repo}`,
        source: 'github',
        sourceUrl: repoUrl,
        status: 'pending',
      },
    });

    void this.processGithubProject(project.id, repoUrl);

    return { id: project.id, status: project.status };
  }

  async createFromUpload(files: LoadedFile[], name?: string) {
    const project = await this.prisma.project.create({
      data: {
        name: name ?? `Upload ${new Date().toISOString()}`,
        source: 'upload',
        status: 'pending',
      },
    });

    void this.processProject(project.id, files);

    return { id: project.id, status: project.status };
  }

  private async processGithubProject(projectId: string, repoUrl: string) {
    try {
      await this.updateStatus(projectId, 'processing');

      const githubToken = this.configService.get<string>('GITHUB_TOKEN');
      const files = await loadGithubRepo(repoUrl, githubToken);

      await this.ingestFiles(projectId, files);

      await this.updateStatus(projectId, 'ready');
    } catch (error) {
      await this.markFailed(projectId, error);
    }
  }

  private async processProject(projectId: string, files: LoadedFile[]) {
    try {
      await this.updateStatus(projectId, 'processing');

      await this.ingestFiles(projectId, files);

      await this.updateStatus(projectId, 'ready');
    } catch (error) {
      await this.markFailed(projectId, error);
    }
  }

  private async updateStatus(projectId: string, status: string) {
    await this.prisma.project.update({
      where: { id: projectId },
      data: { status },
    });
    this.eventEmitter.emit(PROJECT_STATUS_EVENT, { id: projectId, status });
  }

  private async ingestFiles(projectId: string, files: LoadedFile[]) {
    const ingestible = files.filter((file) =>
      isIngestibleFile(file.path, Buffer.byteLength(file.content, 'utf-8')),
    );

    const chunkRecords: {
      filePath: string;
      content: string;
      startLine: number;
      endLine: number;
    }[] = [];

    for (const file of ingestible) {
      for (const chunk of this.chunkingService.chunkFile(file.content)) {
        chunkRecords.push({ filePath: file.path, ...chunk });
      }
    }

    if (chunkRecords.length === 0) {
      return;
    }

    const embeddings = await this.aiService.createEmbeddings(
      chunkRecords.map((chunk) => chunk.content),
      'passage',
    );

    const newChunks: NewChunk[] = chunkRecords.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index],
    }));

    for (let i = 0; i < newChunks.length; i += EMBEDDING_INSERT_BATCH_SIZE) {
      await this.chunkVectorRepository.insertChunks(
        projectId,
        newChunks.slice(i, i + EMBEDDING_INSERT_BATCH_SIZE),
      );
    }
  }

  private async markFailed(projectId: string, error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(
      `Project ${projectId} processing failed: ${message}`,
      error instanceof Error ? error.stack : undefined,
    );

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'failed', error: message },
    });
    this.eventEmitter.emit(PROJECT_STATUS_EVENT, {
      id: projectId,
      status: 'failed',
      error: message,
    });
  }
}
