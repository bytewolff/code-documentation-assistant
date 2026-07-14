import { MessageSquareIcon } from "lucide-react"
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller"
import { Message, MessageContent } from "@/components/ui/message"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Markdown } from "@/components/ui/markdown"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { SourceList } from "@/components/chat/SourceList"
import type { ChatMessage } from "@/types"

export function ChatMessages({
  messages,
  isPending,
}: {
  messages: ChatMessage[]
  isPending: boolean
}) {
  if (messages.length === 0 && !isPending) {
    return (
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageSquareIcon />
          </EmptyMedia>
          <EmptyTitle>Ask about the codebase</EmptyTitle>
          <EmptyDescription>
            Ask a question about the project and get an answer grounded in
            the actual source, with file references.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <MessageScroller className="flex-1">
        <MessageScrollerViewport>
          <MessageScrollerContent className="px-4 py-4">
            {messages.map((message) => (
              <MessageScrollerItem key={message.id}>
                <Message align={message.role === "user" ? "end" : "start"}>
                  <MessageContent>
                    <Bubble
                      align={message.role === "user" ? "end" : "start"}
                      variant={message.role === "user" ? "default" : "muted"}
                    >
                      <BubbleContent
                        className={message.role === "user" ? "whitespace-pre-wrap" : undefined}
                      >
                        {message.role === "assistant" ? (
                          <Markdown>{message.content}</Markdown>
                        ) : (
                          message.content
                        )}
                      </BubbleContent>
                    </Bubble>
                    {message.sources && <SourceList sources={message.sources} />}
                  </MessageContent>
                </Message>
              </MessageScrollerItem>
            ))}
            {isPending && (
              <MessageScrollerItem scrollAnchor>
                <Message align="start">
                  <MessageContent>
                    <Bubble variant="muted">
                      <BubbleContent>
                        <Skeleton className="h-4 w-32" />
                      </BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              </MessageScrollerItem>
            )}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}
