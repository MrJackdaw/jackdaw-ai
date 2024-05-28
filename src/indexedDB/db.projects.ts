import Dexie from "dexie";
import {
  cacheValue,
  deleteCachedValue,
  getCachedValue
} from "./db.shared-utils";
import { UserProject } from "utils/general";

export type CachedProject = {
  key: string;
  value: UserProject;
  expires?: number;
};

/** Storage for cachnig user projects. */
class ProjectsDB extends Dexie {
  public projects: Dexie.Table<CachedProject, string>;

  constructor() {
    super("ProjectsDB");
    this.version(1).stores({ projects: "key,value,expires" });
    this.projects = this.table("projects");
  }
}

const userProjectsDB = new ProjectsDB();
export default userProjectsDB;

export async function cacheProject(
  key: string,
  value: UserProject,
  maxAgeSeconds = 0
) {
  const db = userProjectsDB.projects;
  return cacheValue({ key, value, maxAgeSeconds, db });
}

export async function deleteCachedProject(key: string) {
  return deleteCachedValue(key, userProjectsDB.projects);
}

export async function getCachedProject(key: string) {
  return getCachedValue(key, userProjectsDB.projects);
}

export async function listCachedProjects() {
  return userProjectsDB.projects.toArray().then((c) => c.map((e) => e.value));
}
