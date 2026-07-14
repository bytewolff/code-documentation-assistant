import { Module } from '@nestjs/common';
import { AiService } from './modules/ai/ai.service';
import { AiModule } from './modules/ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [AiModule, ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
  controllers: [],
  providers: [AiService],
})
export class AppModule {}
