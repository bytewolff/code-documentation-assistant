# Code Documentation Assistant

## What it does

- The user uploads a project (either a GitHub repository or project files).
- The backend splits the code into chunks, generates embeddings for each chunk, and stores them in a PostgreSQL database using pgvector.
- When the user asks a question in the chat (frontend), the backend generates an embedding for the question and performs a similarity search in the database to find the most relevant code chunks.
- The retrieved chunks, together with the user's question, are sent to GPT.
- The AI generates an answer based on the provided code context and returns it to the user.

## Tech Stack

### Frontend

- React (19.2.7)
- React Router (8.2.0)
- Tailwind CSS (4.3.2)
- shadcn/ui

### Backend

- NestJS (11.0.1)
- Prisma (7.8.0)
- PostgreSQL (18.0)
- pgvector (0.8.5)
- OpenAI API (6.46.0)

## Architecture Decisions (applies to the entire project)

- **GitHub source:** Download repositories as a **tarball** via a single GitHub API request, then extract them locally (no per-file API requests).
- **File uploads:** Use **multipart/form-data** (ZIP archives are not supported).
- **Chunking:** Simple line-based chunking using sliding windows (~60–80 lines) with an overlap of ~10 lines. Each chunk stores its `startLine` and `endLine`.
- **Project isolation:** Each uploaded project is represented by a `Project` entity with a UUID. No authentication is required; the frontend stores the `projectId`. Calling `DELETE /projects/:id` resets the project, with cascading deletion of all associated chunks.
- **Processing:** Asynchronous ingestion with status tracking (`pending`, `processing`, `ready`, `failed`) stored in the database. For the MVP, background processing is implemented directly, with BullMQ being considered as a future improvement.
- **Chat:** Stateless question-answer flow. Chat history is not persisted. Each response contains an `answer` and a list of `sources` (`filePath`, `startLine`, `endLine`).
- **AI models:** OpenAI `nvidia/nv-embedqa-e5-v5` is used for embeddings (1536-dimensional vectors). The chat model is configured through the `OPENAI_CHAT_MODEL` environment variable (e.g., `openai/gpt-oss-120b`). The prompt instructs the model to answer **only** using the provided code snippets and to reference the relevant source files.
- **pgvector with Prisma:** The `embedding` column is defined as `Unsupported("vector(1536)")`. Embedding insertion and similarity search (cosine distance using the `<=>` operator) are implemented with **raw SQL queries**, since Prisma ORM does not support `Unsupported` types. An HNSW index (`vector_cosine_ops`) is created manually in a SQL migration.
- **File filtering during ingestion:** Only supported source code file extensions are processed. The ingestion pipeline ignores `node_modules/`, `.git/`, `dist/`, lock files, binary files, images, and files larger than approximately **200 KB**.
