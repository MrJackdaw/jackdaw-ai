import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import useSettings from "hooks/useSettings";
import { clearModal } from "state/modal";
import "./AppHeader.scss";

/** Generic top-header (App Name + user image when logged in) */
const AppHeader = () => {
  const { colorIdent } = useSettings(["colorIdent"]);
  const location = useLocation();
  useEffect(() => {
    document.querySelector("#root")?.scrollIntoView();
    clearModal();
  }, [location]);

  return (
    <header id="app-header">
      <h1 className="logo-link">
        <Link to="/inbox" style={{ color: colorIdent }}>
          <b>Jackdaw</b>.ai
        </Link>
      </h1>
    </header>
  );
};

export default AppHeader;
