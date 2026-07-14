import { useLocalStorage } from "@/hooks/useLocalStorage"

const ACTIVE_PROJECT_KEY = "activeProjectId"

export function useActiveProject() {
  const [projectId, setProjectId] = useLocalStorage(ACTIVE_PROJECT_KEY)
  return { projectId, setProjectId }
}
