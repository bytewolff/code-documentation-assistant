import { useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { FolderUpIcon, UploadCloudIcon } from "lucide-react"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type UploadDropzoneProps = {
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void
  onFolderInputChange: (event: ChangeEvent<HTMLInputElement>) => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
}

export function UploadDropzone({
  onFileInputChange,
  onFolderInputChange,
  onDrop,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    setIsDragging(false)
    onDrop(event)
  }

  return (
    <Empty
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "cursor-pointer border transition-colors hover:bg-muted/50",
        isDragging && "border-primary bg-muted/50"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={onFileInputChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error non-standard attributes for directory selection
        webkitdirectory=""
        directory=""
        className="hidden"
        onChange={onFolderInputChange}
      />
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UploadCloudIcon />
        </EmptyMedia>
        <EmptyTitle>Drop a project folder or files here</EmptyTitle>
        <EmptyDescription>
          We'll automatically pick out the relevant source files (ignoring
          node_modules, build output, lockfiles, and binaries).
        </EmptyDescription>
      </EmptyHeader>
      <Button
        type="button"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation()
          folderInputRef.current?.click()
        }}
      >
        <FolderUpIcon />
        Choose a folder
      </Button>
    </Empty>
  )
}
