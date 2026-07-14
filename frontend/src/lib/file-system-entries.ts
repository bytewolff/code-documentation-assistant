export type UploadEntry = { file: File; path: string }

function readDirectoryEntries(
  reader: FileSystemDirectoryReader
): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = []
    const readBatch = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(all)
        } else {
          all.push(...batch)
          readBatch()
        }
      }, reject)
    }
    readBatch()
  })
}

async function walkEntry(entry: FileSystemEntry, out: UploadEntry[]): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) =>
      (entry as FileSystemFileEntry).file(resolve, reject)
    )
    out.push({ file, path: entry.fullPath.replace(/^\/+/, "") })
    return
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader()
    const children = await readDirectoryEntries(reader)
    await Promise.all(children.map((child) => walkEntry(child, out)))
  }
}

export async function collectDroppedEntries(
  dataTransfer: DataTransfer
): Promise<UploadEntry[]> {
  const items = dataTransfer.items ? Array.from(dataTransfer.items) : []
  const supportsEntries = items.length > 0 && typeof items[0]?.webkitGetAsEntry === "function"

  if (!supportsEntries) {
    return Array.from(dataTransfer.files).map((file) => ({ file, path: file.name }))
  }

  const roots = items
    .map((item) => item.webkitGetAsEntry())
    .filter((entry): entry is FileSystemEntry => entry !== null)

  const result: UploadEntry[] = []
  await Promise.all(roots.map((entry) => walkEntry(entry, result)))
  return result
}
