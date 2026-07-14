import { ChatMessages } from "@/components/chat/ChatMessages"
import { ChatInput } from "@/components/chat/ChatInput"
import { useChat } from "@/hooks/useChat"

export function ChatView({ projectId }: { projectId: string }) {
  const { messages, ask, isPending } = useChat(projectId)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ChatMessages messages={messages} isPending={isPending} />
      <div className="border-t border-border p-3">
        <ChatInput onSubmit={ask} disabled={isPending} />
      </div>
    </div>
  )
}
