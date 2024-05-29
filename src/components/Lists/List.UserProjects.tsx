import { useEffect, useMemo } from "react";
import ListView from "./ListView";
import FullscreenLoader from "components/FullscreenLoader";
import useProjects from "hooks/useProjects";
import { MODAL, setModal } from "state/modal";
import { cloudDataFetch } from "data/requests.shared";
import useUser from "hooks/useUser";
import { UserProject, suppressEvent, updateUserSettings } from "utils/general";
import { cacheProject, deleteCachedProject } from "indexedDB";
import UserProjectListItem from "./ListItem.UserProjects";
import { LS_USE_CLOUD_STORE } from "utils/strings";
import { updateAsError } from "state/notifications";
import { loadProjects } from "data/requests.projects";
import { DataAction } from "data/requests.types";
import useSettings from "hooks/useSettings";
import { SettingsStore, toggleOnlineVectorStore } from "state/settings-store";
import "./List.UserProjects.scss";

let init = false;

export default function UserProjectsList() {
  type ProjectResp = { data: UserProject; error?: string };
  const startNewProject = () => setModal(MODAL.MANAGE_PROJECT);
  const { enableCloudStorage } = useSettings(["enableCloudStorage"]);
  const { authenticated, criticalError } = useUser([
    "authenticated",
    "criticalError"
  ]);
  const { projects, selectedProject, fetchingProjects, setLoading } =
    useProjects(["projects", "selectedProject", "fetchingProjects"]);
  const requestInFlight = useMemo(() => {
    return fetchingProjects || !authenticated;
  }, [fetchingProjects, authenticated]);
  const canSyncProjects = useMemo(
    () => enableCloudStorage && projects.some((p) => !p.id),
    [projects, enableCloudStorage]
  );
  const refreshCache = async () => {
    await loadProjects();
    return setLoading(false);
  };
  const fetchProjects = async () => {
    if (requestInFlight || criticalError) return;
    setLoading(true);
    await refreshCache();
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
      .then(() => refreshCache());
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
    return void refreshCache();
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
  const onChangeOnlineStatus = () => {
    toggleOnlineVectorStore();
    updateUserSettings(SettingsStore.getState());
  };

  useEffect(() => {
    if (init) return;
    init = true;
    fetchProjects();
  }, []);

  return (
    <ListView
      className="centered list-view--user-projects"
      data-medium
      data={projects}
      dummyFirstItem={
        <>
          <h4 className="legendary" title="All Projects">
            All Projects
          </h4>

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
          active={Boolean(
            selectedProject?.id === d.id &&
              selectedProject?.__cacheKey === d.__cacheKey
          )}
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
