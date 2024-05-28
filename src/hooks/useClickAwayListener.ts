import { useEffect } from "react";

/** @Hook  Close a component when clicking outside of it, or using the escape key. */
export default function useClickAwayListener(
  /** Element ID of target container (we will listen for clicks outside this element) */
  containerId: string,
  /** Handler to call when the click event happens */
  onClose: () => void,
  /** Prevent event from bubbling to any other elements */
  stopPropagation = false,
  /** When true, trigger for ALL click events including within element `#containerId` */
  triggerForAllClicks = false,
  /** Ignore escape key events when true */
  ignoreEscapeKey = false
) {
  useEffect(() => {
    const cleanup = () => {
      document.removeEventListener("click", handler, true);
      document.removeEventListener("keydown", escHandler, true);
    };
    const handler = (e: MouseEvent) => {
      // If ignoring the closest parent, close after the click handler has fired
      if (triggerForAllClicks) return void setTimeout(onClose);
      const $target = e.target as HTMLElement;
      if ($target.closest(`#${containerId}`)) return;
      onClose();
    };
    // ESC key handler
    const escHandler = (e: KeyboardEvent) => {
      if (ignoreEscapeKey || e.key !== "Escape") return;
      e.preventDefault();
      // optional: prevent from reaching other 'escape' handlers
      if (stopPropagation) e.stopImmediatePropagation();
      onClose();
    };
    document.addEventListener("click", handler, true);
    document.addEventListener("keydown", escHandler, true);
    return cleanup;
  }, []);
}
