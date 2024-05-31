import { MouseEventHandler, useMemo } from "react";
import { UserProject, suppressEvent, updateUserSettings } from "utils/general";
import useSettings from "hooks/useSettings";
import useSubmenuHandler from "hooks/useSubmenuHandler";
import { SettingsStore } from "state/settings-store";
import ItemMenu, { MenuItem } from "components/ItemMenu";
import ContentEditable from "components/ContentEditable";
import ListViewItem, {
  ListViewItemContent,
  ListViewItemTitle
} from "./ListViewItem";
import "./ListItem.UserProjects.scss";

type ListItemProps = {
  active?: boolean;
  /** Default = 'full' */
  display?: "full" | "compact";
  project: UserProject;
  onProjectChange?: { (P: UserProject): any };
  onProjectDelete?: { (P: UserProject): any };
};

/** @ListItemComponent */
export default function UserProjectListItem(props: ListItemProps) {
  const { target, openSubmenu, close, submenuIsVisible } = useSubmenuHandler();
  const { enableCloudStorage } = useSettings(["enableCloudStorage"]);
  const { project, onProjectChange, onProjectDelete, display = "full" } = props;
  const notifyProjectChanged = (
    value: string,
    key: keyof UserProject,
    $elem?: HTMLElement
  ) => {
    if ($elem) $elem.blur();
    if (project[key] === value) return;
    onProjectChange?.({ ...project, [key]: value });
  };
  const tooltip = useMemo(() => {
    const onlineTip = "Your embeddings will be linked to this Project.";
    if (props.active)
      return enableCloudStorage
        ? onlineTip
        : "Disabled because you are offline";
    return enableCloudStorage
      ? "Sync to Cloud"
      : "Offline Project: sync to use.";
  }, [props.active, enableCloudStorage]);
  const iconClass = ["material-symbols-outlined"];
  if (!project.id) iconClass.push("error");
  const [iconValue, activeColor] = useMemo(() => {
    if (project.id)
      return props.active
        ? ["check", enableCloudStorage ? "gold" : "grey"]
        : ["cloud_upload", "white"];
    return ["sync", "white"];
  }, [props.active, enableCloudStorage]);
  const handleTitleChange = (next: string) => {
    notifyProjectChanged(next, "project_name");
  };
  const handleDescrChange = (next: string) => {
    console.log("heheh");
    notifyProjectChanged(next, "description");
  };
  const handleSelect = () => {
    if (!project.id || !enableCloudStorage) return;
    SettingsStore.selectedProject(project.id);
    updateUserSettings(SettingsStore.getState());
  };
  const handleSelectOrSync: MouseEventHandler<HTMLElement> = (e) => {
    suppressEvent(e);
    handleSelect();
    if (props.display !== "compact") return;
    onProjectChange?.(project);
  };

  const materialButton = "button--round material-symbols-outlined transparent";
  const className = ["list-item--projects"];
  if (props.active) className.push("active");
  if (props.display) className.push(props.display);

  return (
    <ListViewItem
      className={className.join(" ").trim()}
      onClick={handleSelectOrSync}
    >
      {/* Icon */}
      {props.display !== "compact" && (
        <span className="list-item__icon-column">
          <button
            type="button"
            className="button--round"
            onClick={handleSelectOrSync}
            disabled={!enableCloudStorage}
          >
            <span className={iconClass.join(" ").trim()}>{iconValue}</span>
          </button>
        </span>
      )}

      {/* Title + Description */}
      <ListViewItemContent>
        <ListViewItemTitle className={activeColor}>
          <ContentEditable
            notifyTextChanged={handleTitleChange}
            aria-disabled={display === "compact"}
          >
            {project.project_name}
          </ContentEditable>
        </ListViewItemTitle>

        {display === "full" && (
          <ContentEditable
            className="description hint"
            notifyTextChanged={handleDescrChange}
          >
            {project.description ?? "(No description)"}
          </ContentEditable>
        )}
      </ListViewItemContent>

      {/* "Show submenu" button */}
      <button
        className={`${materialButton} white`}
        type="button"
        onClick={openSubmenu}
      >
        more_vert
      </button>

      {submenuIsVisible && (
        <ItemMenu target={target} onClose={close}>
          {project.id ? (
            <MenuItem
              aria-disabled={props.active || !enableCloudStorage}
              onClick={() => {
                close();
                handleSelect();
              }}
            >
              <span>
                {props.active ? "(Active Project)" : "Select Project"}
              </span>
              <button
                disabled={props.active}
                className={`${materialButton} ${activeColor}`}
                type="button"
              >
                {props.active ? "check" : "square"}
              </button>
            </MenuItem>
          ) : (
            <MenuItem
              aria-disabled={!enableCloudStorage}
              onClick={() => {
                close();
                onProjectChange?.(project);
              }}
            >
              <span>Sync{!enableCloudStorage && " (app offline)"}</span>
              <button
                disabled={props.active}
                className={`${materialButton} ${activeColor}`}
                type="button"
              >
                refresh
              </button>
            </MenuItem>
          )}

          <MenuItem
            onClick={() => {
              close();
              onProjectDelete?.(project);
            }}
          >
            <span>Delete {enableCloudStorage ? "Project" : "from cache"}</span>
            <button className={`${materialButton} error`} type="button">
              delete
            </button>
          </MenuItem>

          <MenuItem>
            <span className="hint grey">{tooltip}</span>
            <span className="material-symbols-outlined grey">info</span>
          </MenuItem>

          {/* Offline project warning */}
          {!project.id && (
            <MenuItem>
              <span className="hint grey">
                <b>Offline Project:</b> Please sync this project in order to use
                it with an assistant.
              </span>
              <span className="material-symbols-outlined grey">warning</span>
            </MenuItem>
          )}
        </ItemMenu>
      )}
    </ListViewItem>
  );
}
