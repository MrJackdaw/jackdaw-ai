import { version } from "../../package.json";
import { ComponentPropsWithRef } from "react";
import { Link } from "react-router-dom";
import { suppressEvent } from "utils/general";
import { toggleOnlineVectorStore } from "state/settings-store";
import useUser from "hooks/useUser";
import useSubmenuHandler from "hooks/useSubmenuHandler";
import useSettings from "hooks/useSettings";
import ListViewItem, { ListViewItemContent } from "./Lists/ListViewItem";
import ItemMenu from "./ItemMenu";
import "./UserControls.scss";

export default function UserControls(props: ComponentPropsWithRef<"div">) {
  const { enableCloudStorage } = useSettings(["enableCloudStorage"]);
  const { avatar, authenticated } = useUser(["avatar", "authenticated"]);
  const { close, openSubmenu, submenuIsVisible, target } = useSubmenuHandler();
  const classes = ["user-controls"];
  if (props.className) classes.push(props.className);

  return (
    <div>
      <ListViewItem className={classes.join(" ").trim()} onClick={openSubmenu}>
        {/* User Settings */}
        <button className="button--round transparent white" type="button">
          {authenticated && avatar ? (
            <img src={avatar} height={39} width="auto" className="avatar" />
          ) : (
            /* User Avatar / Login / Logout */
            <span className="material-symbols-outlined">settings</span>
          )}
        </button>

        <ListViewItemContent>Settings</ListViewItemContent>

        <span className="material-symbols-outlined">arrow_forward_ios</span>
      </ListViewItem>

      {submenuIsVisible && (
        <ItemMenu target={target} onClose={close} placement="top">
          <Link
            className="item-menu__item user-control__item"
            to="/settings/assistant-settings"
            onClick={close}
          >
            <span>Assistant settings</span>
            <span className="material-symbols-outlined">psychology</span>
          </Link>

          <Link
            className="item-menu__item user-control__item"
            to="/settings/general-settings"
            onClick={close}
          >
            <span>General Settings</span>
            <span className="material-symbols-outlined">settings</span>
          </Link>

          {authenticated ? (
            <Link
              className="item-menu__item user-control__item"
              to="/settings/my-projects"
              onClick={close}
            >
              <span>My Projects</span>
              <span className="material-symbols-outlined">security</span>
            </Link>
          ) : (
            <Link
              className="item-menu__item user-control__item"
              to="/login"
              onClick={close}
            >
              <span>Log in</span>
              <span className="material-symbols-outlined">lock</span>
            </Link>
          )}

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

          <hr />
          <p className="hint" style={{ textAlign: "right" }}>
            version {version}
          </p>
        </ItemMenu>
      )}
    </div>
  );
}
