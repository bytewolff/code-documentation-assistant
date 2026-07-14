import { XIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { UploadEntry } from "@/lib/file-system-entries"

type UploadFileListProps = {
  entries: UploadEntry[]
  onRemove: (path: string) => void
}

export function UploadFileList({ entries, onRemove }: UploadFileListProps) {
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((entry) => (
        <Badge key={entry.path} variant="secondary" className="gap-1">
          {entry.path}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(entry.path)
            }}
            aria-label={`Remove ${entry.path}`}
          >
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}
