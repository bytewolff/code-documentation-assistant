import { useQuery } from "@tanstack/react-query"
import { getProject } from "@/lib/api"

const ACTIVE_STATUSES = new Set(["pending", "processing"])

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id!),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && ACTIVE_STATUSES.has(status) ? 2000 : false
    },
  })
}
