import { useNavigate, useParams } from "react-router"
import { AppHeader } from "@/components/layout/AppHeader"
import { ProcessingStatus } from "@/components/project/ProcessingStatus"
import { ChatView } from "@/components/chat/ChatView"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useProject } from "@/hooks/useProject"
import { useProjectStatus } from "@/hooks/useProjectStatus"
import { useActiveProject } from "@/hooks/useActiveProject"

export function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const { data: project, isLoading, isError, error } = useProject(id)
  const { setProjectId } = useActiveProject()
  const navigate = useNavigate()
  useProjectStatus(id)

  const handleBackHome = () => {
    setProjectId(null)
    navigate("/")
  }

  return (
    <div className="flex h-svh flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col overflow-hidden">
        {isError ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <Alert variant="destructive" className="max-w-md">
              <AlertTitle>Couldn't load this project</AlertTitle>
              <AlertDescription className="flex flex-col gap-3">
                <span>
                  {error instanceof Error
                    ? error.message
                    : "The backend is unreachable."}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={handleBackHome}
                >
                  Back to start
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : isLoading || !project ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="size-6" />
          </div>
        ) : (
          <ProcessingStatus project={project}>
            <ChatView projectId={project.id} />
          </ProcessingStatus>
        )}
      </main>
    </div>
  )
}
