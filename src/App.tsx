import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useModal from "hooks/useModal";
import useUser from "hooks/useUser";
import LoginRoute from "routes/Route.Login";
import NotificationsList from "components/Lists/List.Notifications";
import FullscreenLoader from "components/FullscreenLoader";
import OAuthRoute from "components/OAuthNotice";
import AppSidebar from "components/AppSidebar";
import "./App.scss";

// ROUTES
const MBoxRoute = lazy(() => import("routes/Route.Chat"));
const Settings = lazy(() => import("routes/Route.Settings"));
const Projects = lazy(() => import("routes/Route.Projects"));

// DIALOGS
const WelcomeUserDialog = lazy(
  () => import("components/Dialogs/Dialog.WelcomeUser")
);
const ProjectDetailsDialog = lazy(
  () => import("components/Dialogs/Dialog.ProjectDetails")
);

function App() {
  const { initialized: loaded } = useUser(["initialized"]);
  const { active, MODAL } = useModal();

  return (
    <BrowserRouter>
      <AppSidebar />

      {loaded ? (
        <Suspense fallback={<FullscreenLoader fullscreen />}>
          <Routes>
            <Route index element={<MBoxRoute />} />
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/inbox" element={<Navigate to="/chat" />} />
            <Route path="/chat" element={<MBoxRoute />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/:settingsView" element={<Settings />} />
          </Routes>
        </Suspense>
      ) : (
        <FullscreenLoader fullscreen msg={<OAuthRoute />} />
      )}

      <Suspense fallback={<FullscreenLoader msg="Loading modal..." />}>
        {active === MODAL.WELCOME_USER && <WelcomeUserDialog />}
        {active === MODAL.MANAGE_PROJECT && <ProjectDetailsDialog open />}
      </Suspense>

      <NotificationsList />
    </BrowserRouter>
  );
}

export default App;
