import type { AskQuestionResponse, Project } from "@/types"

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const message = await res
      .json()
      .then((body: { message?: string | string[] }) =>
        Array.isArray(body.message) ? body.message.join(", ") : body.message
      )
      .catch(() => undefined)
    throw new Error(message ?? `Request failed with status ${res.status}`)
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export function createFromGithub(repoUrl: string, name?: string) {
  return request<{ id: string; status: string }>("/projects", {
    method: "POST",
    body: JSON.stringify({ repoUrl, name }),
  })
}

export function createFromUpload(formData: FormData) {
  return request<{ id: string; status: string }>("/projects/upload", {
    method: "POST",
    body: formData,
  })
}

export function getProject(id: string) {
  return request<Project>(`/projects/${id}`)
}

export function deleteProject(id: string) {
  return request<void>(`/projects/${id}`, { method: "DELETE" })
}

export function askQuestion(id: string, question: string) {
  return request<AskQuestionResponse>(`/projects/${id}/chat`, {
    method: "POST",
    body: JSON.stringify({ question }),
  })
}
