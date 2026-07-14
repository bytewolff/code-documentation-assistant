import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useCreateProject } from "@/hooks/useCreateProject"
import { useUploadEntries } from "@/hooks/useUploadEntries"
import { UploadDropzone } from "@/components/project/UploadDropzone"
import { UploadFileList } from "@/components/project/UploadFileList"

export function UploadForm() {
  const { uploadMutation } = useCreateProject()
  const {
    entries,
    handleFileInputChange,
    handleFolderInputChange,
    handleDrop,
    removeEntry,
  } = useUploadEntries()

  const handleSubmit = () => {
    if (entries.length === 0) return
    const formData = new FormData()
    for (const entry of entries) formData.append("files", entry.file, entry.path)
    uploadMutation.mutate(formData)
  }

  return (
    <div className="flex flex-col gap-4">
      <UploadDropzone
        onFileInputChange={handleFileInputChange}
        onFolderInputChange={handleFolderInputChange}
        onDrop={handleDrop}
      />

      <UploadFileList entries={entries} onRemove={removeEntry} />

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={entries.length === 0 || uploadMutation.isPending}
      >
        {uploadMutation.isPending && <Spinner />}
        Create project
      </Button>
    </div>
  )
}
