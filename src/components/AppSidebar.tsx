import AppHeader from "./AppHeader";
import UserControls from "./UserControls";
import "./AppSidebar.scss";

export default function AppSidebar() {
  return (
    <section className="app-sidebar">
      <AppHeader />

      {/* TODO projects list or similar */}
      <div />

      <UserControls />
    </section>
  );
}
