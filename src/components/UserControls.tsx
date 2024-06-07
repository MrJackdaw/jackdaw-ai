import { version } from "../../package.json";
import { ComponentPropsWithRef } from "react";
import { Link } from "react-router-dom";
import { suppressEvent, truncateMidString } from "utils/general";
import { toggleOnlineVectorStore } from "state/settings-store";
import useUser from "hooks/useUser";
import useSubmenuHandler from "hooks/useSubmenuHandler";
import useSettings from "hooks/useSettings";
import { ListViewItemContent } from "./Lists/ListViewItem";
import ItemMenu from "./ItemMenu";
import { JRoutes } from "routes";
import "./UserControls.scss";
import { logoutUser } from "data/requests";

export default function UserControls(props: ComponentPropsWithRef<"div">) {
  const { enableCloudStorage, owner } = useSettings([
    "enableCloudStorage",
    "owner"
  ]);
  const { avatar, authenticated } = useUser(["avatar", "authenticated"]);
  const { close, openSubmenu, submenuIsVisible, target } = useSubmenuHandler();
  const classes = ["user-controls"];
  if (props.className) classes.push(props.className);

  return (
    <aside className={classes.join(" ").trim()}>
      <button
        className="button--grid slide-in-right"
        type="button"
        onClick={openSubmenu}
      >
        {/* User Settings */}
        <span className="button--round transparent white">
          {authenticated && avatar ? (
            <img src={avatar} height={39} width="auto" className="avatar" />
          ) : (
            /* User Avatar / Login / Logout */
            <span className="material-symbols-outlined">settings</span>
          )}
        </span>

        <ListViewItemContent>
          <span className="ellipsis">{truncateMidString(owner)}</span>
          <span className="material-symbols-outlined">arrow_forward_ios</span>
        </ListViewItemContent>
      </button>

      {submenuIsVisible && (
        <ItemMenu target={target} onClose={close} placement="top">
          {authenticated && (
            <>
              <form
                className="enable-cloud-storage"
                onSubmit={suppressEvent}
                data-tooltip={authenticated ? undefined : "Log in to change"}
              >
                <label className="hint" data-checkbox>
                  <input
                    type="checkbox"
                    disabled={!authenticated}
                    onChange={toggleOnlineVectorStore}
                    checked={enableCloudStorage}
                  />
                  <span className="label">Store Documents online</span>
                </label>
              </form>

              <Link
                className="item-menu__item user-control__item"
                to={JRoutes.Projects}
                onClick={close}
              >
                <span>My Projects</span>
                <span className="material-symbols-outlined">folder_open</span>
              </Link>
            </>
          )}

          <Link
            className="item-menu__item user-control__item"
            to={JRoutes.AssistantSettings}
            onClick={close}
          >
            <span>Assistant settings</span>
            <span className="material-symbols-outlined">psychology</span>
          </Link>

          <Link
            className="item-menu__item user-control__item"
            to={JRoutes.GeneralSettings}
            onClick={close}
          >
            <span>General Settings</span>
            <span className="material-symbols-outlined">settings</span>
          </Link>

          {authenticated ? (
            <Link
              className="item-menu__item user-control__item error"
              to={JRoutes.Login}
              onClick={logoutUser}
            >
              <span>Log out</span>
              <span className="material-symbols-outlined">lock</span>
            </Link>
          ) : (
            <Link
              className="item-menu__item user-control__item"
              to={JRoutes.Login}
              onClick={close}
            >
              <span>Log in</span>
              <span className="material-symbols-outlined">lock</span>
            </Link>
          )}

          <div className="item-menu--footer item-menu__item">
            <Link
              className="flex"
              to={import.meta.env.VITE_DOCS_SITE}
              target="_blank"
            >
              <span className="material-symbols-outlined">help</span>&nbsp;
              <span>Help Docs</span>
            </Link>

            <span className="hint">version {version}</span>
          </div>
        </ItemMenu>
      )}
    </aside>
  );
}
