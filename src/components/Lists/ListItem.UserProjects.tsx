import { UserProject, suppressEvent, updateUserSettings } from "utils/general";
import { SettingsStore } from "state/settings-store";
import useSubmenuHandler from "hooks/useSubmenuHandler";
import { MouseEventHandler, useMemo } from "react";
import ItemMenu from "components/ItemMenu";
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
  const { enableCloudStorage } = SettingsStore.getState();
  const { project, onProjectChange, onProjectDelete } = props;
  const notifyProjectChanged = (
    value: string,
    key: keyof UserProject,
    $elem?: HTMLElement
  ) => {
    if ($elem) $elem.blur();
    if (project[key] === name) return;
    onProjectChange?.({ ...project, [key]: value });
  };
  const tooltip = useMemo(() => {
    const onlineTip = "Your embeddings will be linked to this Project.";
    if (props.active) return onlineTip;
    return enableCloudStorage ? "Sync to Cloud" : "Offline";
  }, []);
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
    notifyProjectChanged(next, "description");
  };
  const handleSelectOrSync: MouseEventHandler<HTMLElement> = (e) => {
    if (props.display !== "compact") return;
    suppressEvent(e);
    if (project.id) {
      SettingsStore.selectedProject(project.id);
      updateUserSettings(SettingsStore.getState());
    }
    onProjectChange?.(project);
  };

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
          {props.display === "compact" ? (
            <span className="description hint">
              {project.description ?? "(No description)"}
            </span>
          ) : (
            <ContentEditable notifyTextChanged={handleTitleChange}>
              {project.project_name}
            </ContentEditable>
          )}
        </ListViewItemTitle>

        <ContentEditable
          className="description hint"
          notifyTextChanged={handleDescrChange}
        >
          {project.description ?? "(No description)"}
        </ContentEditable>
      </ListViewItemContent>

      {/* Delete button */}
      <button
        className="button--round transparent white"
        type="button"
        onClick={openSubmenu}
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>

      {submenuIsVisible && (
        <ItemMenu target={target} onClose={close}>
          <span
            className="item-menu__item"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              close();
              onProjectDelete?.(project);
            }}
          >
            <span>Delete Project</span>

            <button className="button--round transparent" type="button">
              <span className="material-symbols-outlined error">delete</span>
            </button>
          </span>
        </ItemMenu>
      )}
    </ListViewItem>
  );
}
