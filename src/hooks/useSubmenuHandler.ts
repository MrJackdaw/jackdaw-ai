/**
 * @file GlobalSubmenuHandler.ts
 * @desc Global Submenu Handler Hook.
 */

import { MouseEventHandler, useState } from "react";
import { suppressEvent } from "utils/general";

/**
 * @Hook Show/hide a submenu component. Used in any component that contains a `button` for
 * showing/hiding a submenu, as well as the submenu element itself.
 *
 * How it works: The Hook provides
 *
 * - A `open()` function to attach to the show/hide button (or other HTML target)
 * - A `close()` function to hide the submenu (attach to whatever you like)
 * - A `target` value that references the show/hide button (or other HTML target). This is
 * initially null, but will be populated when `open()` is clicked.
 * - A boolean that indicates whether the submenu target is currently visible. Actual
 * visibility implementation is left to the developer. */
export default function useSubmenuHandler() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [submenuIsVisible, setSubmenuIsVisible] = useState(false);
  const close = () => {
    setSubmenuIsVisible(false);
    setTarget(null);
  };
  const open: MouseEventHandler = (e) => {
    suppressEvent(e);
    setTarget(e.currentTarget as HTMLElement);
    setSubmenuIsVisible(true);
  };

  return {
    /** element that was clicked on (for positioning). Usage: `<ContentSubmenu target={target} />` */
    target,
    /** Submenu is visible when "true" */
    submenuIsVisible,
    /** Toggle Submenu visibility */
    open,
    /** close Submenu */
    close
  };
}
