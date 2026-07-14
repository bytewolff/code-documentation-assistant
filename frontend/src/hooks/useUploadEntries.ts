import { useState, type ChangeEvent, type DragEvent } from "react"
import { toast } from "sonner"
import { isIngestibleFile } from "@/lib/file-filter"
import { collectDroppedEntries, type UploadEntry } from "@/lib/file-system-entries"

export function useUploadEntries() {
  const [entries, setEntries] = useState<UploadEntry[]>([])

  const addEntries = (incoming: UploadEntry[]) => {
    const ingestible = incoming.filter((entry) =>
      isIngestibleFile(entry.path, entry.file.size)
    )
    const skipped = incoming.length - ingestible.length
    if (skipped > 0) {
      toast.info(
        `Skipped ${skipped} file${skipped === 1 ? "" : "s"} (node_modules, lockfiles, binaries, or files over 200KB)`
      )
    }
    if (ingestible.length === 0) return

    setEntries((prev) => {
      const map = new Map(prev.map((entry) => [entry.path, entry]))
      for (const entry of ingestible) map.set(entry.path, entry)
      return Array.from(map.values())
    })
  }

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    addEntries(Array.from(files).map((file) => ({ file, path: file.name })))
    event.target.value = ""
  }

  const handleFolderInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    addEntries(
      Array.from(files).map((file) => ({
        file,
        path: file.webkitRelativePath || file.name,
      }))
    )
    event.target.value = ""
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    void collectDroppedEntries(event.dataTransfer).then(addEntries)
  }

  const removeEntry = (path: string) => {
    setEntries((prev) => prev.filter((entry) => entry.path !== path))
  }

  return {
    entries,
    handleFileInputChange,
    handleFolderInputChange,
    handleDrop,
    removeEntry,
  }
}
