# Code Documentation Assistant

Upload a GitHub repository (or a folder of files) and ask questions about it in
plain English. The backend chunks the code, embeds it, stores it in Postgres
with `pgvector`, and answers questions with an LLM grounded in the most
relevant chunks (RAG).

## a. Quick setup

**Prerequisites:** Docker, npm (Node 20+ also works), and an
API key for an OpenAI-compatible endpoint (the project defaults to
[NVIDIA NIM](https://build.nvidia.com), which has a free tier — see
`backend/src/modules/ai/ai.service.ts`).

```bash
git clone <this-repo>
cd code-documentation-assistant

# 1. Postgres (pgvector) credentials for docker-compose
cp .env.example .env

# 2. Backend — fill in OPENAI_API_KEY (and optionally GITHUB_TOKEN
#    to avoid GitHub's unauthenticated rate limit on the tarball download)
cp backend/.env.example backend/.env

# 3. Frontend
cp frontend/.env.example frontend/.env

# 4. Start Postgres + pgvector
docker compose up -d

# 5. Backend (installs deps, runs migrations, starts on :3000)
cd backend
npm install
npm run db:migrate
npm run start:dev

# 6. Frontend, in another shell (starts on :5173)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, paste a public GitHub repo URL (or drop a
folder), wait for ingestion to finish, and start asking questions.

## b. Architecture overview

The **frontend** (React + Vite) talks to the **backend** (NestJS) over REST
for actions and Server-Sent Events for ingestion status. The backend has two
main paths: the **ingestion module**, which pulls source from a GitHub
tarball or an upload, chunks and embeds it, and writes it to Postgres; and
the **chat module**, which embeds the question, retrieves the closest chunks,
and asks the chat model for an answer. Both paths share two external
dependencies: **Postgres + pgvector**, which stores `Project` and `Chunk`
rows and does the similarity search, and **NVIDIA NIM**, which provides both
the embedding and chat models.

**Ingestion flow:** repo tarball or uploaded files → filtered by extension /
size / ignore-list → split into ~80-line chunks (10-line overlap) → embedded
in batches → inserted into `Chunk` with a raw-SQL `vector` insert. Status
(`pending → processing → ready|failed`) is tracked on `Project` and pushed to
the frontend over Server-Sent Events (`GET /projects/:id/events`) instead of
polling.

**Chat flow:** question → embedded (as a `query`, chunks were embedded as
`passage` — the embedding model is asymmetric) → cosine similarity search
(`<=>` operator, HNSW index, top 6) → chunks + question sent to the chat model
with a system prompt that restricts it to the provided code → answer +
`sources` (file path, line range) returned to the client.

## c. Productionizing / scaling on a hyperscaler

The current build is a single-instance MVP: ingestion runs as an in-process
async function, uploads live in memory (`multer` memoryStorage), and there's
no auth. To make it production-ready on, say, AWS:

- **Decouple ingestion from the API process.** Push a job to SQS (or
  BullMQ + ElastiCache/Redis) instead of `void this.processProject(...)`, and
  run ingestion in separate worker tasks (ECS/Fargate) that scale
  independently from the request-serving API. This also gets you retries and
  backoff for GitHub/embedding API failures, which don't exist today.
- **Managed Postgres with pgvector** — RDS/Aurora Postgres now supports the
  `vector` extension, or a purpose-built provider (Supabase, Neon). Keep the
  HNSW index; at real scale, consider splitting hot (recent) vs. cold
  projects or moving to a dedicated vector store if filtering/QPS outgrows
  pgvector.
- **Stateless API containers behind an ALB**, autoscaled (ECS Fargate or
  EKS), so chat/ingestion requests scale horizontally. Store uploaded files
  in S3 rather than in memory so any worker can pick up a job.
- **Frontend as a static build** on S3 + CloudFront (or Vercel/Cloudflare
  Pages) — it's a Vite SPA with no server-side rendering need.
- **Secrets** (OpenAI/NIM key, GitHub token, DB URL) in AWS Secrets Manager /
  SSM Parameter Store, injected at task startup, not `.env` files.
- **Observability**: structured logging (e.g. pino) shipped to
  CloudWatch/Datadog, tracing around the embed/search/completion calls,
  and token/cost metrics per project — none of this exists yet (see
  section d).
- **Guardrails for a multi-tenant world**: auth (projects currently have no
  owner), per-project rate limits on ingestion and chat, and a queue-depth
  cap so one huge repo upload can't starve everyone else.
- **IaC + CI/CD**: Terraform for the above, GitHub Actions to run
  lint/test/build and deploy on merge — there's no CI configured right now.

## d. RAG/LLM approach & decisions

- **LLM**: chat model is whatever `OPENAI_CHAT_MODEL` points to, called
  through the OpenAI SDK against an OpenAI-compatible base URL — currently
  NVIDIA NIM's `openai/gpt-oss-120b`. I picked NIM over calling OpenAI
  directly because it's free to use for a project like this and is a drop-in
  swap (same SDK, just a different `baseURL` and model string), so switching
  back to `gpt-4o-mini` or similar later is a one-line env change, not a
  rewrite.
- **Embeddings**: `nvidia/nv-embedqa-e5-v5` (1024-dim), also via NIM. This
  model is asymmetric — queries and passages need different `input_type`
  values — which `text-embedding-3-small` doesn't require. I kept that
  distinction explicit in `AiService.createEmbeddings` rather than hiding it,
  since silently mixing query/passage encodings would quietly degrade
  retrieval quality. The project actually started on OpenAI's 1536-dim
  embeddings and migrated to this 1024-dim model (see the
  `nvidia_embed_1024` migration, which truncates existing chunks since
  embeddings from different models aren't comparable).
- **Vector database**: `pgvector` inside the same Postgres instance, not a
  dedicated vector DB (Pinecone/Weaviate/Qdrant). For a project-scoped RAG
  tool where each project's chunks are already relational data (`Project`
  1:N `Chunk`), adding a second database is pure operational overhead for no
  retrieval-quality benefit at this scale. Prisma doesn't model the `vector`
  type or the `<=>` operator, so inserts and similarity search are raw SQL
  (`ChunkVectorRepository`) rather than fighting the ORM.
- **Orchestration framework**: none — no LangChain/LlamaIndex. The pipeline
  is five explicit steps (filter → chunk → embed → search → prompt), and at
  that size a framework buys abstraction I don't need and hides the exact
  prompt/context being sent, which matters when you're debugging answer
  quality.
- **Chunking**: fixed-size sliding window (80 lines, 10-line overlap) rather
  than AST-aware or semantic chunking. It's language-agnostic (one code path
  for `.py`, `.go`, `.tsx`, ...) and every chunk carries its own
  `startLine`/`endLine`, so "show me the source" always works. The tradeoff
  is that chunks can cut through the middle of a function — a tree-sitter or
  language-aware chunker would produce cleaner semantic units.
- **Prompt & context management**: top-6 chunks by cosine similarity, each
  labeled with its file path, concatenated into the prompt. The system
  prompt explicitly restricts the model to the provided snippets, asks it to
  say when it doesn't have enough context, and requires Markdown with a
  specific rule against multi-line code inside table cells (an easy failure
  mode once the model starts summarizing multiple files as a table).
- **Guardrails**: an allowlist of source-code extensions plus an ignore-list
  (`node_modules/`, `.git/`, lockfiles, `dist/`, etc.) and a 200KB per-file
  cap keep binaries, dependency noise, and huge generated files out of the
  index — both for answer quality and to bound ingestion cost. DTO
  validation (`class-validator`) rejects malformed requests before they hit
  any service. There's no output moderation/PII filtering — out of scope for
  a code-only assistant, but worth naming.
- **Quality & observability — the honest gap**: there's no retrieval eval set
  (precision/recall on known question→chunk pairs), no answer-quality
  scoring, and no tracing of latency/token cost per request. Logging is
  whatever Nest's default `Logger` gives you. This is the area I'd invest in
  first with more time (section h).

## e. Key technical decisions

- **GitHub via tarball, not per-file API calls** — one authenticated request
  downloads the whole repo, avoiding the GitHub REST API's per-file rate
  limits on anything but tiny repos.
- **Uploads as `multipart/form-data`, not ZIP** — the browser can hand over a
  folder's files directly (`webkitdirectory`), and the server never has to
  safely unzip an untrusted archive (zip-bomb/path-traversal surface).
- **In-process async ingestion instead of a queue** — `IngestionService`
  kicks off `void this.processProject(...)` and reports progress via an
  in-memory event emitter + SSE. This is a deliberate MVP shortcut (also
  called out in `CLAUDE.md`): it's simple and demoable, but it does not
  survive a process restart mid-ingestion and doesn't scale past one
  instance. BullMQ is the documented next step.
- **No auth, UUID-scoped projects** — matches the assignment's scope (no
  login), with `DELETE /projects/:id` cascading to its chunks. This is fine
  for a demo; it's the first thing to change before anything resembling
  multi-tenant use (section c).
- **Stateless chat, no persisted history** — each `POST /projects/:id/chat`
  is independent; the frontend keeps the transcript client-side. This keeps
  the backend simple and matches "ask questions about this codebase" rather
  than a general conversational assistant — the tradeoff is no
  follow-up-question context (“what about the second one?” won’t work).

## f. Engineering standards followed (and skipped)

**Followed:**

- Modular NestJS architecture — one module per bounded concern (`ingestion`,
  `chat`, `projects`, `ai`), not a single fat service.
- DTO validation at every controller boundary (`class-validator` +
  `ValidationPipe({ whitelist: true, transform: true })`).
- Migrations checked into git, including the pgvector HNSW index and the
  embedding-model migration — both of which Prisma can't generate on its own
  for `Unsupported` types, so they're written and reasoned about by hand.
- ESLint + Prettier on both frontend and backend; magic numbers pulled into
  one `constants.ts` with a comment pointing back at the file that uses each
  one.
- `.env.example` files kept in sync with what the code actually reads.

**Skipped, consciously, for the MVP timebox:**

- No unit or integration tests beyond Nest's generated e2e boilerplate —
  `chunking.service.ts`, `file-filter.ts`, and the retrieval path are exactly
  the kind of pure/deterministic logic that should have unit tests, and
  don't yet.
- No CI pipeline (lint/test/build on push).
- No retry/backoff around the GitHub tarball fetch or the embedding/chat API
  calls — a transient failure currently just fails the whole ingestion.
- No rate limiting on ingestion or chat endpoints.

## g. How I used AI tools in this project

I used Claude Code to perform simple tasks, such as setting up the basic project architecture and writing boilerplate code. In addition, I used it to perform simple routine tasks, including refactoring code, generating helper functions, creating basic components, and fixing minor bugs. This allowed me to focus on implementing the project’s core logic and speed up the development process.

## h. What I'd do differently with more time

- Replace in-process ingestion with a real queue (BullMQ/SQS) with retries,
  concurrency limits, and resumability.
- Language-aware chunking (tree-sitter) instead of fixed line windows, to
  stop splitting functions across chunk boundaries.
- A small retrieval/answer-quality eval set, so changes to chunking, top-K,
  or the prompt can be measured instead of eyeballed.
- Stream chat responses (SSE/WebSocket) instead of one blocking round trip —
  the SSE plumbing already exists for ingestion status.
- Persist chat history per project and support follow-up questions.
- Basic auth/ownership on projects, plus rate limiting on ingestion.
- Tracing + token/cost metrics per request, and structured logs.
