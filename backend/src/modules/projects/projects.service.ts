import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { _count: { select: { chunks: true } } },
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    const { _count, ...rest } = project;
    return { ...rest, chunksCount: _count.chunks };
  }

  async remove(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    await this.prisma.project.delete({ where: { id } });
  }
}
