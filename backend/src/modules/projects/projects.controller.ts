import {
  Controller,
  Delete,
  Get,
  HttpCode,
  MessageEvent,
  Param,
  Sse,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, concat, from, fromEvent, of } from 'rxjs';
import { filter, map, switchMap, takeWhile } from 'rxjs/operators';
import {
  PROJECT_STATUS_EVENT,
  ProjectStatusEvent,
} from 'src/common/events/project-status.event';
import { ProjectsService } from './projects.service';

const TERMINAL_STATUSES = new Set(['ready', 'failed']);

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.projectsService.remove(id);
  }

  @Sse(':id/events')
  events(@Param('id') id: string): Observable<MessageEvent> {
    return from(this.projectsService.findOne(id)).pipe(
      switchMap((project) => {
        const initial: ProjectStatusEvent = {
          id: project.id,
          status: project.status,
          error: project.error,
        };

        const live$ = fromEvent<ProjectStatusEvent>(
          this.eventEmitter,
          PROJECT_STATUS_EVENT,
        ).pipe(filter((event) => event.id === id));

        return concat(of(initial), live$);
      }),
      takeWhile((event) => !TERMINAL_STATUSES.has(event.status), true),
      map((event) => ({ data: event })),
    );
  }
}
