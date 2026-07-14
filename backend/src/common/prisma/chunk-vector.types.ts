export interface NewChunk {
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  embedding: number[];
}

export interface SimilarChunk {
  id: string;
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  similarity: number;
}
