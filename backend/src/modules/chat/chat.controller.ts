import { Body, Controller, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AskQuestionDto } from './dto/ask-question.dto';

@Controller('projects')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post(':id/chat')
  ask(@Param('id') id: string, @Body() dto: AskQuestionDto) {
    return this.chatService.ask(id, dto.question);
  }
}
