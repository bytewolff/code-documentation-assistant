export interface LoadedFile {
  path: string;
  content: string;
}

export interface Chunk {
  content: string;
  startLine: number;
  endLine: number;
}
