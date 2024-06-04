import useUser from "hooks/useUser";
import UserProjectsList from "components/Lists/List.UserProjects";
import LoginView from "components/View.Login";
import usePreserveRouteHistory from "hooks/usePreserveRouteHistory";

/** Inbox-Reader route */
export default function ProjectsRoute() {
  const { authenticated } = useUser(["authenticated"]);

  usePreserveRouteHistory();

  return (
    <section className="route route--projects">
      <header>
        <h1 className="h4">My Projects</h1>
      </header>

      {authenticated ? <UserProjectsList /> : <LoginView />}
    </section>
  );
}
