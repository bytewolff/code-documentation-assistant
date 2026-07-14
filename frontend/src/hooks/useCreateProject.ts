import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { createFromGithub, createFromUpload } from "@/lib/api"
import { useActiveProject } from "@/hooks/useActiveProject"

export function useCreateProject() {
  const navigate = useNavigate()
  const { setProjectId } = useActiveProject()

  const onSuccess = (data: { id: string }) => {
    setProjectId(data.id)
    navigate(`/project/${data.id}`)
  }

  const onError = (error: Error) => {
    toast.error(error.message)
  }

  const githubMutation = useMutation({
    mutationFn: ({ repoUrl, name }: { repoUrl: string; name?: string }) =>
      createFromGithub(repoUrl, name),
    onSuccess,
    onError,
  })

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => createFromUpload(formData),
    onSuccess,
    onError,
  })

  return { githubMutation, uploadMutation }
}
