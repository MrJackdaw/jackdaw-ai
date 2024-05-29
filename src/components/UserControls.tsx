import { version } from "../../package.json";
import { Link } from "react-router-dom";
import useUser from "hooks/useUser";
import { MODAL, ModalStore, clearModal, setModal } from "state/modal";
import useSubmenuHandler from "hooks/useSubmenuHandler";
import ListViewItem, { ListViewItemContent } from "./Lists/ListViewItem";
import ItemMenu from "./ItemMenu";
import "./UserControls.scss";

export default function UserControls() {
  const { avatar, authenticated } = useUser(["avatar", "authenticated"]);
  const { close, openSubmenu, submenuIsVisible, target } = useSubmenuHandler();
  const toggleSettings = () => {
    close();
    const { active } = ModalStore.getState();
    if (active === MODAL.SETTINGS_GLOBAL) return clearModal();
    setModal(MODAL.SETTINGS_GLOBAL);
  };

  return (
    <div>
      <ListViewItem className="user-controls" onClick={openSubmenu}>
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
          <div
            role="menu-item"
            className="item-menu__item user-control__item"
            onClick={toggleSettings}
          >
            <span>Assistant settings</span>
            <span className="material-symbols-outlined">psychology</span>
          </div>

          <Link
            className="item-menu__item user-control__item"
            to="/settings/general-settings"
            onClick={close}
          >
            <span>General Settings</span>
            <span className="material-symbols-outlined">settings</span>
          </Link>

          {authenticated ? (
            <>
              <Link
                className="item-menu__item user-control__item"
                to="/settings/my-projects"
                onClick={close}
              >
                <span>My Projects</span>
                <span className="material-symbols-outlined">security</span>
              </Link>
            </>
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

          <hr />
          <p className="hint">version {version}</p>
        </ItemMenu>
      )}
    </div>
  );
}
