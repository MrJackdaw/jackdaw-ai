import { UserProject, suppressEvent, updateUserSettings } from "utils/general";
import { SettingsStore } from "state/settings-store";
import useSubmenuHandler from "hooks/useSubmenuHandler";
import { MouseEventHandler, useMemo } from "react";
import ItemMenu, { MenuItem } from "components/ItemMenu";
import ContentEditable from "components/ContentEditable";
import ListViewItem, {
  ListViewItemContent,
  ListViewItemTitle
} from "./ListViewItem";
import "./ListItem.UserProjects.scss";
import useSettings from "hooks/useSettings";

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
    if (props.active) return onlineTip;
    return enableCloudStorage ? "Sync to Cloud" : "Offline";
  }, [props]);
  const iconClass = ["material-symbols-outlined"];
  if (!project.id) iconClass.push("error");
  const iconValue = useMemo(() => {
    if (project.id) return props.active ? "check" : "cloud_upload";
    return "sync";
  }, [props.active]);
  const handleTitleChange = (next: string) => {
    notifyProjectChanged(next, "project_name");
  };
  const handleDescrChange = (next: string) => {
    console.log("heheh");
    notifyProjectChanged(next, "description");
  };
  const handleSelect = () => {
    if (!project.id) return;
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
  const activeColor = props.active ? "gold" : "white";
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
        <span className="list-item__icon-column" data-tooltip={tooltip}>
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
        <ListViewItemTitle>
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
              aria-disabled={props.active}
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
            <span>Delete Project</span>
            <button className={`${materialButton} error`} type="button">
              delete
            </button>
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
