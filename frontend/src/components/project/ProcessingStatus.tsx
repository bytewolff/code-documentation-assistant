import type { ReactNode } from "react"
import { useNavigate } from "react-router"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { deleteProject } from "@/lib/api"
import { useActiveProject } from "@/hooks/useActiveProject"
import type { Project } from "@/types"

export function ProcessingStatus({
  project,
  children,
}: {
  project: Project
  children: ReactNode
}) {
  const navigate = useNavigate()
  const { setProjectId } = useActiveProject()

  const resetMutation = useMutation({
    mutationFn: () => deleteProject(project.id),
    onSuccess: () => {
      setProjectId(null)
      navigate("/")
    },
    onError: (error: Error) => toast.error(error.message),
  })

  if (project.status === "failed") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Processing failed</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>{project.error ?? "Something went wrong while processing this project."}</span>
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
            >
              Start over
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (project.status === "pending" || project.status === "processing") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <Spinner className="size-6" />
        <p className="font-medium">
          {project.status === "pending" ? "Queued for processing…" : "Indexing your code…"}
        </p>
        <p className="text-sm text-muted-foreground">
          This can take a minute for larger projects. The chat will unlock
          automatically once it's ready.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
