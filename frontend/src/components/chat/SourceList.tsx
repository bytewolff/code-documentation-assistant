import { ChevronRightIcon, FileIcon } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import type { Source } from "@/types"

export function SourceList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null

  return (
    <Collapsible className="w-fit max-w-full">
      <CollapsibleTrigger className="group flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ChevronRightIcon className="size-3 transition-transform group-data-panel-open:rotate-90" />
        {sources.length} source{sources.length > 1 ? "s" : ""}
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-1 pt-2">
        {sources.map((source, index) => (
          <Badge key={index} variant="outline" className="w-fit gap-1 font-mono font-normal">
            <FileIcon className="size-3" />
            {source.filePath}:{source.startLine}–{source.endLine}
          </Badge>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
