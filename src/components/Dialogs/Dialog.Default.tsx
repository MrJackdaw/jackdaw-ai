import { ComponentPropsWithRef } from "react";
import { createPortal } from "react-dom";
import useEscapeKeyListener from "hooks/useEscapeKeyListener";
import { clearModal } from "state/modal";
import useSettings from "hooks/useSettings";

type ModalProps = Omit<ComponentPropsWithRef<"dialog">, "onClose" | "title"> & {
  /** Close event handler */
  onClose?: { (event?: any): void };
  onConfirm?: { (): void };
  disableConfirmation?: boolean;
  materialIcon?: string;
  showControls?: boolean;
  sticky?: boolean;
  title?: string;
};

/** @Modal Default Modal container (for shared UI and other behaviors) */
export default function Dialog(props: ModalProps) {
  const {
    children,
    className,
    onClose = clearModal,
    onConfirm,
    materialIcon,
    showControls,
    sticky,
    disableConfirmation,
    title,
    open: _o,
    ...rest
  } = props;
  const classes = ["dialog", className].join(" ");
  const { colorIdent } = useSettings(["colorIdent"]);

  // close modal on escape key press
  useEscapeKeyListener(onClose);

  const $elem = (
    <dialog open className={classes} onClose={() => onClose()} {...rest}>
      {/* Header (icon + title + close button) */}
      <header className="modal__header">
        {title && (
          <h1 className="grid" style={{ gridTemplateColumns: "auto 1fr" }}>
            <button
              className="button--round button--icon"
              style={{ color: colorIdent }}
            >
              <span className="material-symbols-outlined">{materialIcon}</span>
            </button>
            <span className="legendary" title={title}>
              {title}
            </span>
          </h1>
        )}

        {!sticky && (
          <button
            type="button"
            onClick={() => onClose()}
            className="button--transparent button--round button--exit"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </header>

      {/* Dialog contents */}
      {children}

      {/* (optional) Controls */}
      {showControls && (
        <div className="dialog-controls">
          <button
            type="button"
            className="button--transparent"
            onClick={() => onClose()}
          >
            Exit
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="bg--success"
            disabled={disableConfirmation || !onConfirm}
          >
            Save settings
          </button>
        </div>
      )}
    </dialog>
  );

  const $parent = document.getElementById("overlays");
  if (!$parent) return null;

  return createPortal($elem, $parent);
}
