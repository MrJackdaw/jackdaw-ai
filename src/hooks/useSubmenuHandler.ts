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
 * - A `openSubmenu` function to attach to the show/hide button (or other HTML target)
 * - A `target` value that references the show/hide button (or other HTML target). This is
 * initially null, but will be populated when `openSubmenu` is clicked.
 * - A boolean that indicates whether the submenu target is currently visible (note: actual
 * visibility implementation is left to the developer)
 * - And a helper function for closing (not toggling) the submenu. */
export default function useSubmenuHandler() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [showSubmenu, setShowSubmenu] = useState(false);
  const close = () => {
    setShowSubmenu(false);
    setTarget(null);
  };
  const openSubmenu: MouseEventHandler = (e) => {
    suppressEvent(e);
    setTarget(e.currentTarget as HTMLElement);
    setShowSubmenu(true);
  };

  return {
    /** element that was clicked on (for positioning). Usage: `<ContentSubmenu target={target} />` */
    target,
    /** Submenu is visible when "true" */
    showSubmenu,
    /** Toggle Submenu visibility */
    openSubmenu,
    /** close Submenu */
    close
  };
}
