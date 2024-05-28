import {
  cacheProject,
  cacheUserSetting,
  getCachedSetting,
  listCachedProjects
} from "indexedDB";
import { ProjectsStore } from "state/user-projects";
import { UserProject } from "utils/general";
import { cloudDataFetch } from "./requests.shared";
import { SETTING__PROJECT_SYNC, LS_USE_CLOUD_STORE } from "utils/strings";
import { DateTime } from "luxon";

export async function refreshProjectsCache() {
  const fetchRemote = localStorage.getItem(LS_USE_CLOUD_STORE)
    ? cloudDataFetch<{ data: UserProject[] }>("user-projects:list")
    : Promise.resolve({ data: [] });

  // Fetch remote projects if cloud storage is enabled
  return (
    fetchRemote
      // Write response to cache, then re-fetch the cache
      .then(({ data: projects = [] }) => {
        projects.forEach((p) => p.id && cacheProject(p.id.toString(), p));
        return listCachedProjects();
      })
      // Write cache to state
      .then((projects) => {
        // log time of cache invalidation
        cacheUserSetting(
          SETTING__PROJECT_SYNC,
          DateTime.now().plus({ minutes: 15 }).toISO()
        );

        ProjectsStore.multiple({ projects, fetchingProjects: false });
        return projects;
      })
  );
}

/** Fetch User projects from remote or cache, depending on cache setting */
export async function loadProjects() {
  ProjectsStore.fetchingProjects(true);

  const [nextSync, cachedProjects] = await Promise.all([
    getCachedSetting(SETTING__PROJECT_SYNC),
    listCachedProjects()
  ]);
  const staleCache = !nextSync || DateTime.fromISO(nextSync) < DateTime.now();
  if (staleCache) return refreshProjectsCache();

  ProjectsStore.multiple({ projects: cachedProjects, fetchingProjects: false });
}
