export const CONSTANTS = {
  // src/modules/ai/ai.service.ts
  aiService: {
    // nvidia/nv-embedqa-e5-v5 NIM caps batch size at 50
    EMBEDDING_BATCH_SIZE: 50,
  },

  // src/modules/chat/chat.service.ts
  chatService: {
    TOP_K: 6,
  },

  // src/modules/ingestion/chunking.service.ts
  chunkingService: {
    CHUNK_SIZE: 80,
    CHUNK_OVERLAP: 10,
  },

  // src/modules/ingestion/file-filter.ts
  fileFilter: {
    MAX_FILE_SIZE_BYTES: 200 * 1024,
    ALLOWED_EXTENSIONS: new Set([
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.mjs',
      '.cjs',
      '.py',
      '.go',
      '.java',
      '.kt',
      '.rb',
      '.rs',
      '.c',
      '.h',
      '.cpp',
      '.hpp',
      '.cs',
      '.php',
      '.swift',
      '.scala',
      '.sql',
      '.sh',
      '.yaml',
      '.yml',
      '.json',
      '.md',
      '.mdx',
      '.html',
      '.css',
      '.scss',
      '.vue',
      '.prisma',
    ]),
    IGNORED_PATH_SEGMENTS: [
      'node_modules/',
      '.git/',
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      'vendor/',
    ],
    IGNORED_FILENAMES: new Set([
      'package-lock.json',
      'bun.lock',
      'bun.lockb',
      'yarn.lock',
      'pnpm-lock.yaml',
    ]),
  },

  // src/modules/ingestion/ingestion.controller.ts
  ingestionController: {
    MAX_UPLOAD_FILES: 500,
  },

  // src/modules/ingestion/ingestion.service.ts
  ingestionService: {
    EMBEDDING_INSERT_BATCH_SIZE: 50,
  },
} as const;
