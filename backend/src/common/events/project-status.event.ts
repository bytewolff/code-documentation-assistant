export const PROJECT_STATUS_EVENT = 'project.status';

export interface ProjectStatusEvent {
  id: string;
  status: string;
  error?: string | null;
}
