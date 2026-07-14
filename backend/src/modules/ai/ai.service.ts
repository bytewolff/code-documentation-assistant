import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { CONSTANTS } from 'src/common/constants';

const { EMBEDDING_BATCH_SIZE } = CONSTANTS.aiService;

export interface ChunkContext {
  filePath: string;
  content: string;
}

type EmbeddingInputType = 'query' | 'passage';

@Injectable()
export class AiService {
  private readonly openai: OpenAI;
  private readonly chatModel: string;
  private readonly embedModel: string;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: configService.get<string>('OPENAI_API_KEY'),
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
    this.chatModel = this.configService.get<string>(
      'OPENAI_CHAT_MODEL',
      'openai/gpt-oss-120b',
    );
    this.embedModel = this.configService.get<string>(
      'OPENAI_EMBED_MODEL',
      'nvidia/nv-embedqa-e5-v5',
    );
  }

  async createEmbeddings(
    texts: string[],
    inputType: EmbeddingInputType,
  ): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
      const response = await this.openai.embeddings.create({
        model: this.embedModel,
        input: batch,
        // NV-EmbedQA/E5 models are asymmetric: query vs passage need separate encodings.
        // These are NVIDIA-specific fields, not in the OpenAI SDK types, so they're merged
        // directly onto the request body rather than using Python's `extra_body` convention.
        ...({ input_type: inputType, truncate: 'END' } as object),
      });
      embeddings.push(...response.data.map((item) => item.embedding));
    }

    return embeddings;
  }

  async answer(question: string, contexts: ChunkContext[]): Promise<string> {
    const contextText = contexts
      .map((c) => `File: ${c.filePath}\n\`\`\`\n${c.content}\n\`\`\``)
      .join('\n\n');

    const completion = await this.openai.chat.completions.create({
      model: this.chatModel,
      messages: [
        {
          role: 'system',
          content:
            "Answer the question using only the code fragments below. Mention the relevant file paths in your answer. If the fragments don't contain enough information to answer, say so. " +
            'Format the answer as Markdown. Never put multi-line code blocks inside a table cell (tables cannot contain real line breaks); instead reference files with a bullet list and place any code excerpts in fenced code blocks below it.',
        },
        {
          role: 'user',
          content: `Code fragments:\n${contextText}\n\nQuestion: ${question}`,
        },
      ],
      temperature: 1,
      top_p: 1,
      max_tokens: 4096,
      stream: false,
    });

    return completion.choices[0]?.message?.content ?? '';
  }
}
