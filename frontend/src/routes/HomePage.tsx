import { Navigate } from "react-router"
import { AppHeader } from "@/components/layout/AppHeader"
import { NewProjectForm } from "@/components/project/NewProjectForm"
import { useActiveProject } from "@/hooks/useActiveProject"

export function HomePage() {
  const { projectId } = useActiveProject()

  if (projectId) {
    return <Navigate to={`/project/${projectId}`} replace />
  }

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="flex flex-1 items-center justify-center p-6">
        <NewProjectForm />
      </main>
    </div>
  )
}
