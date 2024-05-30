import { useEffect, useMemo } from "react";
import ListView from "./ListView";
import FullscreenLoader from "components/FullscreenLoader";
import useProjects from "hooks/useProjects";
import { MODAL, setModal } from "state/modal";
import { cloudDataFetch } from "data/requests.shared";
import useUser from "hooks/useUser";
import { UserProject, suppressEvent } from "utils/general";
import { cacheProject, deleteCachedProject } from "indexedDB";
import UserProjectListItem from "./ListItem.UserProjects";
import { LS_USE_CLOUD_STORE } from "utils/strings";
import { updateAsError } from "state/notifications";
import { loadProjects, refreshProjectsCache } from "data/requests.projects";
import { DataAction } from "data/requests.types";
import useSettings from "hooks/useSettings";
import { toggleOnlineVectorStore } from "state/settings-store";
import "./List.UserProjects.scss";

let init = false;

type Props = { display?: "full" | "compact" };

export default function UserProjectsList({ display }: Props) {
  type ProjectResp = { data: UserProject; error?: string };
  const startNewProject = () => setModal(MODAL.MANAGE_PROJECT);
  const { enableCloudStorage, selectedProject } = useSettings([
    "enableCloudStorage",
    "selectedProject"
  ]);
  const { authenticated, criticalError } = useUser([
    "authenticated",
    "criticalError"
  ]);
  const { projects, fetchingProjects, setLoading } = useProjects([
    "projects",
    "fetchingProjects"
  ]);
  const requestInFlight = useMemo(() => {
    return fetchingProjects || !authenticated;
  }, [fetchingProjects, authenticated]);
  const canSyncProjects = useMemo(
    () => enableCloudStorage && projects.some((p) => !p.id),
    [projects, enableCloudStorage]
  );
  const fetchProjects = async () => {
    if (requestInFlight || criticalError) return;
    await loadProjects();
  };
  const syncProjects = async () => {
    setLoading(true);
    const updated: UserProject[] = [];
    const batch: Promise<UserProject>[] = [];
    projects.forEach((p) => {
      if (p.id) return;
      updated.push(p);
      batch.push(
        cloudDataFetch<UserProject>("user-projects:insert", {
          name: p.project_name,
          description: p.description
        })
      );
    });

    await Promise.all(batch)
      .then(() =>
        Promise.all(updated.map((p) => deleteCachedProject(p.__cacheKey!)))
      )
      .then(refreshProjectsCache);
  };
  const onProjectChanged = (
    error?: string | null,
    cacheKey?: string | null
  ) => {
    if (error) {
      setLoading(false);
      return void updateAsError(error);
    }

    if (cacheKey) deleteCachedProject(cacheKey);
    return void refreshProjectsCache();
  };
  const optsFromProject = (project: UserProject) => ({
    id: project.id ?? undefined,
    name: project.project_name,
    description: project.description
  });
  const handleProjectSync = async (project: UserProject) => {
    const cacheKey = (project.__cacheKey || project.id?.toString()) ?? null;
    if (cacheKey) cacheProject(cacheKey, project);
    if (!localStorage.getItem(LS_USE_CLOUD_STORE)) return;
    const opts = optsFromProject(project);
    setLoading(true);
    const action: DataAction = project.id
      ? "user-projects:update"
      : "user-projects:insert";
    cloudDataFetch<ProjectResp>(action, opts).then((res) =>
      onProjectChanged(res?.error, cacheKey)
    );
  };
  const handleProjectDelete = async (project: UserProject) => {
    const opts = { projectId: project.id };
    const cacheKey = (project.__cacheKey || project.id?.toString()) ?? null;
    const removeFromCloud =
      project.id && localStorage.getItem(LS_USE_CLOUD_STORE)
        ? cloudDataFetch<{ data: { projectId: number }; error?: string }>(
            "user-projects:delete",
            opts
          )
        : Promise.resolve(null);

    setLoading(true);
    removeFromCloud.then((res) => onProjectChanged(res?.error, cacheKey));
  };
  /* updates worker*/
  const onChangeOnlineStatus = () => toggleOnlineVectorStore();

  useEffect(() => {
    if (init) return;
    init = true;
    fetchProjects();
  }, []);

  const classes = ["centered", "list-view--user-projects"];
  if (display) classes.push(display);

  return (
    <ListView
      className={classes.join(" ").trim()}
      data-medium={display !== "compact"}
      data={projects}
      dummyFirstItem={
        <>
          <h4 className="legendary">All Projects</h4>

          <form className="enable-cloud-storage" onSubmit={suppressEvent}>
            <label className="hint" data-checkbox>
              <input
                type="checkbox"
                onChange={onChangeOnlineStatus}
                checked={enableCloudStorage}
              />
              <span className="label">Store Documents online</span>
            </label>
          </form>
        </>
      }
      placeholder={
        fetchingProjects ? (
          <FullscreenLoader msg="Fetching projects..." />
        ) : null
      }
      itemText={(d) => (
        <UserProjectListItem
          active={selectedProject === d.id}
          display={display}
          project={d}
          onProjectChange={handleProjectSync}
          onProjectDelete={handleProjectDelete}
        />
      )}
      dummyLastItem={
        <div className="controls--grid">
          <button
            type="button"
            className="button--grid transparent"
            disabled={fetchingProjects || !canSyncProjects}
            onClick={syncProjects}
          >
            <span className="material-symbols-outlined">sync</span>
            <span>Sync Projects</span>
          </button>

          <button
            type="button"
            disabled={fetchingProjects}
            className="button--grid"
            onClick={startNewProject}
          >
            <span className="material-symbols-outlined">add</span>
            <span>New Project</span>
          </button>
        </div>
      }
    />
  );
}
