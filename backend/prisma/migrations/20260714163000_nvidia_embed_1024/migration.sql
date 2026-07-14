-- Switch embeddings provider to NVIDIA NIM (nvidia/nv-embedqa-e5-v5), which outputs 1024-dim vectors
-- instead of OpenAI text-embedding-3-small's 1536-dim vectors. Existing embeddings are not compatible
-- across models, so chunks must be re-ingested.
DROP INDEX IF EXISTS "chunk_embedding_idx";

TRUNCATE TABLE "Chunk";

ALTER TABLE "Chunk" ALTER COLUMN "embedding" TYPE vector(1024);

CREATE INDEX "chunk_embedding_idx" ON "Chunk" USING hnsw (embedding vector_cosine_ops);
