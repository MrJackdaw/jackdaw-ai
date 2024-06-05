import useUser from "hooks/useUser";
import UserProjectsList from "components/Lists/List.UserProjects";
import LoginView from "components/View.Login";
import usePreserveRouteHistory from "hooks/usePreserveRouteHistory";
import TabbedInterface from "components/TabbedInterface";

/** Inbox-Reader route */
export default function ProjectsRoute() {
  const { authenticated } = useUser(["authenticated"]);

  usePreserveRouteHistory();

  return (
    <section className="route route--projects">
      <header>
        <h1 className="h4">My Projects</h1>
      </header>

      <TabbedInterface tabs={[{ label: "All Projects", icon: "folder" }]}>
        {authenticated ? <UserProjectsList /> : <LoginView />}
      </TabbedInterface>
    </section>
  );
}
