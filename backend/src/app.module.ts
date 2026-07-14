import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AiModule } from './modules/ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    AiModule,
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    ProjectsModule,
    IngestionModule,
    ChatModule,
  ],
})
export class AppModule {}
