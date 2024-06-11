import { useMemo } from "react";
import usePreserveRouteHistory from "hooks/usePreserveRouteHistory";
import useSettings from "hooks/useSettings";
import useUser from "hooks/useUser";
import LoginView from "components/View.Login";
import TabbedInterface from "components/TabbedInterface";
import UserDocumentsList from "components/Lists/List.UserDocs";
import UserProjectsList from "components/Lists/List.UserProjects";

/** Inbox-Reader route */
export default function ProjectsRoute() {
  const { authenticated } = useUser(["authenticated"]);
  const { selectedProject, enableCloudStorage } = useSettings([
    "selectedProject",
    "enableCloudStorage"
  ]);
  const showDocuments = useMemo(
    () => Boolean(selectedProject) && enableCloudStorage,
    [selectedProject]
  );
  const tabs = [{ label: "All Projects", icon: "folder" }];
  if (showDocuments)
    tabs.push({ label: "Project Documents", icon: "contextual_token" });

  usePreserveRouteHistory();

  return (
    <section className="route route--projects">
      <header>
        <h1 className="h4">My Projects</h1>
      </header>

      <TabbedInterface tabs={tabs}>
        {authenticated ? <UserProjectsList /> : <LoginView />}
        <UserDocumentsList projectId={selectedProject} />
      </TabbedInterface>
    </section>
  );
}
