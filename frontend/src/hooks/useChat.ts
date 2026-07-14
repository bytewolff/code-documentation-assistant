import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { askQuestion } from "@/lib/api"
import type { ChatMessage } from "@/types"

function storageKey(projectId: string) {
  return `chat:${projectId}`
}

function loadMessages(projectId: string): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(storageKey(projectId))
    return raw ? (JSON.parse(raw) as ChatMessage[]) : []
  } catch {
    return []
  }
}

export function useChat(projectId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadMessages(projectId)
  )

  useEffect(() => {
    window.localStorage.setItem(storageKey(projectId), JSON.stringify(messages))
  }, [projectId, messages])

  const mutation = useMutation({
    mutationFn: (question: string) => askQuestion(projectId, question),
  })

  const ask = async (question: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      const { answer, sources } = await mutation.mutateAsync(question)
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: answer, sources },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            error instanceof Error
              ? `Error: ${error.message}`
              : "Something went wrong while answering.",
        },
      ])
    }
  }

  return { messages, ask, isPending: mutation.isPending }
}
