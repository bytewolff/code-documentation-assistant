import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async generateResponse(prompt: string): Promise<string> {
    const response = await this.openai.responses.create({
      model: 'gpt-5.4-mini',
      input: prompt,
      store: true,
    });

    return response.output_text;
  }
}
