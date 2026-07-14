import { useNavigate } from "react-router"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { FileCodeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { deleteProject } from "@/lib/api"
import { useActiveProject } from "@/hooks/useActiveProject"

export function AppHeader() {
  const navigate = useNavigate()
  const { projectId, setProjectId } = useActiveProject()

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (projectId) await deleteProject(projectId)
    },
    onSuccess: () => {
      setProjectId(null)
      navigate("/")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="flex items-center gap-2 font-heading font-medium">
        <FileCodeIcon className="size-5 text-primary" />
        Code Documentation Assistant
      </div>
      <div className="flex items-center gap-2">
        {projectId && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline">New project</Button>} />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start a new project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the current project and all of its indexed
                  code. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => resetMutation.mutate()}
                >
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}
