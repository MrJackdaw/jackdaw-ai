import { Link } from "react-router-dom";
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
import { JRoutes } from "routes";

let init = false;
type Props = { display?: "full" | "compact"; showTitle?: boolean };

export default function UserProjectsList({ display, showTitle }: Props) {
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
  const fetchProjects = async () => {
    if (requestInFlight || criticalError) return;
    await loadProjects();
  };
  // Save local projects to cloud, and fetch projects
  const syncProjects = async () => {
    setLoading(true);
    const updated: UserProject[] = [];
    const batch: Promise<UserProject>[] = [];
    if (enableCloudStorage) {
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
    }

    await Promise.all(batch)
      .then(() =>
        Promise.all(updated.map((p) => deleteCachedProject(p.__cacheKey!)))
      )
      .then(refreshProjectsCache);
  };
  const onProjectChanged = (error?: string | null) => {
    setLoading(false);
    return void (error ? updateAsError(error) : refreshProjectsCache());
  };
  const optsFromProject = (project: UserProject) => ({
    id: project.id ?? undefined,
    name: project.project_name,
    description: project.description
  });
  const handleProjectSync = async (pj: UserProject) => {
    const cacheKey = (pj.__cacheKey || pj.id?.toString()) ?? null;
    if (cacheKey) cacheProject(cacheKey, pj);
    if (!localStorage.getItem(LS_USE_CLOUD_STORE)) return onProjectChanged();
    const opts = optsFromProject(pj);
    setLoading(true);
    const action: DataAction = pj.id
      ? "user-projects:update"
      : "user-projects:insert";
    const res = await cloudDataFetch<ProjectResp>(action, opts);
    if (cacheKey) deleteCachedProject(cacheKey);
    onProjectChanged(res?.error);
  };
  const handleProjectDelete = async (project: UserProject) => {
    const cacheKey = (project.__cacheKey || project.id?.toString()) ?? null;
    if (cacheKey) deleteCachedProject(cacheKey);

    const opts = { projectId: project.id };
    if (project.id) {
      return cloudDataFetch<{ data: { projectId: number }; error?: string }>(
        "user-projects:delete",
        opts
      ).then((res) => onProjectChanged(res?.error));
    }

    return onProjectChanged();
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
          {showTitle && <h4 className="legendary">All Projects</h4>}

          {display !== "compact" && (
            <details>
              <summary>
                <span className="material-symbols-outlined">info</span>
                <span>
                  What are <span className="gold">Projects</span>?
                </span>
              </summary>

              <p className="hint">
                <span className="gold">
                  A project is a collection of (your) documents.
                </span>
                &nbsp; They help to organize your data. They can also provide
                additional context: when you ask a question with a project
                selected, your virtual assistant can use information from that
                project to assist you.
              </p>
            </details>
          )}

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
          active={enableCloudStorage && selectedProject === d.id}
          display={display}
          project={d}
          onProjectChange={handleProjectSync}
          onProjectDelete={handleProjectDelete}
        />
      )}
      dummyLastItem={
        display === "compact" ? (
          <Link to={JRoutes.Projects} className="button button--grid">
            <span>Manage Projects</span>
            <span className="material-symbols-outlined">arrow_forward_ios</span>
          </Link>
        ) : (
          authenticated && (
            <div className="controls--grid">
              <button
                type="button"
                className="button--grid transparent"
                disabled={fetchingProjects}
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
                <span className="material-symbols-outlined">
                  create_new_folder
                </span>
                <span>New Project</span>
              </button>
            </div>
          )
        )
      }
    />
  );
}
