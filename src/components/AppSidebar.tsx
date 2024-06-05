import AppHeader from "./AppHeader";
import UserControls from "./UserControls";
import "./AppSidebar.scss";
import useUser from "hooks/useUser";
import UserProjectsList from "./Lists/List.UserProjects";

export default function AppSidebar() {
  const { authenticated } = useUser(["authenticated"]);

  return (
    <section className="app-sidebar">
      <AppHeader />

      <div className="app-sidebar__content">
        {authenticated && <UserProjectsList showTitle display="compact" />}
      </div>

      <UserControls />
    </section>
  );
}
