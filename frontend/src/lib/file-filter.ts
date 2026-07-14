// Mirrors backend/src/modules/ingestion/file-filter.ts so folders can be
// filtered down to ingestible files before they're uploaded.
const MAX_FILE_SIZE_BYTES = 200 * 1024

const ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".java",
  ".kt",
  ".rb",
  ".rs",
  ".c",
  ".h",
  ".cpp",
  ".hpp",
  ".cs",
  ".php",
  ".swift",
  ".scala",
  ".sql",
  ".sh",
  ".yaml",
  ".yml",
  ".json",
  ".md",
  ".mdx",
  ".html",
  ".css",
  ".scss",
  ".vue",
  ".prisma",
])

const IGNORED_PATH_SEGMENTS = [
  "node_modules/",
  ".git/",
  "dist/",
  "build/",
  ".next/",
  "coverage/",
  "vendor/",
]

const IGNORED_FILENAMES = new Set([
  "package-lock.json",
  "bun.lock",
  "bun.lockb",
  "yarn.lock",
  "pnpm-lock.yaml",
])

export function filePath(file: File): string {
  return file.webkitRelativePath || file.name
}

export function isIngestibleFile(path: string, sizeBytes: number): boolean {
  if (sizeBytes > MAX_FILE_SIZE_BYTES) return false

  const fileName = path.split("/").pop() ?? ""
  if (IGNORED_FILENAMES.has(fileName)) return false

  if (IGNORED_PATH_SEGMENTS.some((segment) => path.includes(segment))) {
    return false
  }

  const dotIndex = fileName.lastIndexOf(".")
  if (dotIndex === -1) return false

  const extension = fileName.slice(dotIndex).toLowerCase()
  return ALLOWED_EXTENSIONS.has(extension)
}

export function filterIngestibleFiles(files: File[]): File[] {
  return files.filter((file) => isIngestibleFile(filePath(file), file.size))
}
