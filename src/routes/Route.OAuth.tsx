import OAuthNotice from "components/OAuthNotice";
import useUser from "hooks/useUser";
import { Navigate } from "react-router-dom";
import { JRoutes } from "routes";

export default function OAuthRoute() {
  const { authenticated } = useUser(["authenticated"]);

  return authenticated ? (
    <Navigate to={JRoutes.Chat} replace />
  ) : (
    // <FullscreenLoader fullscreen msg={<OAuthNotice />} />
    <OAuthNotice />
  );
}
