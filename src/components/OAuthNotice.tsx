import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LS_NEXT_PATH } from "utils/strings";
import { completeOAuthFlow, initializeUserState } from "data/requests";
import { initializeMboxModule } from "mbox/Mbox";
import "./OAuthNotice.scss";

let init = false;

export default function OAuthNotice() {
  const { hash } = useLocation();
  const redirectTo = useMemo(() => localStorage.getItem(LS_NEXT_PATH), [hash]);
  const navigate = useNavigate();
  const createSession = async () => {
    if (init) return;
    init = true;

    // If there's a hash in the URL, complete OAuth before fetching the user
    // Otherwise, fetch the user first; either way, proceed as normal.
    return (hash ? completeOAuthFlow(hash) : Promise.resolve())
      .then(initializeUserState)
      .finally(() => {
        // Initialize file parser and worker handler
        initializeMboxModule();
        navigate(redirectTo || "/inbox");
      });
  };

  useEffect(() => {
    createSession();
  }, []);

  return (
    <aside className="oauth-notice">
      <header>
        <h3 className="legendary">Creating your session</h3>
      </header>
      <p className="text">You will be redirected shortly...</p>
    </aside>
  );
}
