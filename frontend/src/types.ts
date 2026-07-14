export type ProjectStatus = "pending" | "processing" | "ready" | "failed"

export type ProjectSource = "github" | "upload"

export interface Project {
  id: string
  name: string
  source: ProjectSource
  sourceUrl: string | null
  status: ProjectStatus
  error: string | null
  chunksCount: number
  createdAt: string
  updatedAt: string
}

export interface Source {
  filePath: string
  startLine: number
  endLine: number
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Source[]
}

export interface AskQuestionResponse {
  answer: string
  sources: Source[]
}
