import createState from "@jackcom/raphsducks";
import { UserProject } from "utils/general";

export const ProjectsStore = createState({
  fetchingProjects: false,
  projects: [] as UserProject[],
  editingProject: null as UserProject | null
});

export type ProjectsStoreInstance = ReturnType<typeof ProjectsStore.getState>;
export type ProjectsStoreKey = keyof ProjectsStoreInstance;
