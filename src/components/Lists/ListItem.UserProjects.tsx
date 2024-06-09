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
  onProjectReset?: { (P: UserProject): any };
};

/** @ListItemComponent */
export default function UserProjectListItem(props: ListItemProps) {
  const { target, open, close, submenuIsVisible } = useSubmenuHandler();
  const { enableCloudStorage } = useSettings(["enableCloudStorage"]);
  const {
    project,
    onProjectChange,
    onProjectDelete,
    onProjectReset,
    display = "full"
  } = props;
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
    const onlineTip = "Your uploads will be added to this Project.";
    if (props.active)
      return enableCloudStorage
        ? onlineTip
        : "Offline: uploads kept on your computer";
    if (!project.id && enableCloudStorage)
      return "Sync this project in order to use it with an assistant.";
    return "";
  }, [props.active, enableCloudStorage]);
  const iconClass = ["material-symbols-outlined"];
  if (!project.id) iconClass.push("error");
  const [iconValue, activeColor] = useMemo(() => {
    if (project.id)
      return props.active
        ? ["folder_open", enableCloudStorage ? "gold" : "grey"]
        : ["folder", "white"];
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
            submitOnBlur
          >
            {project.project_name}
          </ContentEditable>
        </ListViewItemTitle>

        {display === "full" && (
          <ContentEditable
            className="description hint"
            notifyTextChanged={handleDescrChange}
            submitOnBlur
          >
            {project.description ?? "(No description)"}
          </ContentEditable>
        )}
      </ListViewItemContent>

      {/* "Show submenu" button */}
      <button
        className={`${materialButton} white`}
        type="button"
        onClick={open}
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
            className={project.id ? "gold" : "grey"}
            aria-disabled={!project.id}
            onClick={() => {
              close();
              onProjectReset?.(project);
            }}
          >
            <span>Remove all Documents</span>
            <button
              className={`${materialButton} ${project.id ? "gold" : "grey"}`}
              type="button"
            >
              history
            </button>
          </MenuItem>

          <MenuItem
            onClick={() => {
              close();
              onProjectDelete?.(project);
            }}
          >
            <span className="error">Delete Project</span>
            <button className={`${materialButton} error`} type="button">
              delete
            </button>
          </MenuItem>

          {(tooltip || !enableCloudStorage) && (
            <MenuItem>
              <span className="hint grey">
                {/* Offline warning */}
                {!enableCloudStorage && <b>Cloud storage is disabled! </b>}
                {tooltip}
              </span>
              <span className="material-symbols-outlined grey center">
                {project.id && enableCloudStorage ? "info" : "warning"}
              </span>
            </MenuItem>
          )}
        </ItemMenu>
      )}
    </ListViewItem>
  );
}
