import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/lib/api";
import type { Project, ProjectStatus } from "@/types";

const TERMINAL_STATUSES = new Set<ProjectStatus>(["ready", "failed"]);

export function useProjectStatus(id: string | undefined) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!id) return;

        const source = new EventSource(`${API_URL}/projects/${id}/events`);

        source.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as Partial<Project> & {
                    status: ProjectStatus;
                };
                queryClient.setQueryData(
                    ["project", id],
                    (prev: Project | undefined) =>
                        prev ? { ...prev, ...data } : prev,
                );
                if (TERMINAL_STATUSES.has(data.status)) {
                    source.close();
                }
            } catch (error) {
                console.error("Failed to parse SSE data:", error);
            }
        };

        source.onerror = () => {
            source.close();
        };

        return () => source.close();
    }, [id, queryClient]);
}
