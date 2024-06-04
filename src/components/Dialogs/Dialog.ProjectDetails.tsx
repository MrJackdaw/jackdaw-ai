import { ComponentPropsWithRef } from "react";
import useEscapeKeyListener from "hooks/useEscapeKeyListener";
import { clearModal } from "state/modal";
import ProjectDetailsForm from "components/Forms/Form.ProjectDetails";
import Dialog from "./Dialog.Default";

type ModalProps = Omit<ComponentPropsWithRef<"dialog">, "onClose"> & {
  onClose?: { (): void };
};

/** @Modal Create or edit a Document project */
export default function ProjectDetailsDialog(props: ModalProps) {
  const { className, onClose = clearModal, ...rest } = props;
  const classes = ["dialog--project-details", className].join(" ");

  // close modal on escape key press
  useEscapeKeyListener(onClose);

  return (
    <Dialog
      id="dialog--project-details"
      data-medium
      className={classes}
      onClose={onClose}
      title="Create New Project"
      materialIcon="create_new_folder"
      {...rest}
    >
      <ProjectDetailsForm />
    </Dialog>
  );
}
