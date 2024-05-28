import { useEffect } from "react";

/**
 * Captures when a blur event occurs on a component
 *
 * Example:
 * ```typescript
 * import useEscapeKeyListener from 'hooks/GlobalEscapeKeyEvents'
 *
 * useEscapeKeyListener(callBack)
 * ```
 * @param onEscape - callback to be triggered on ESC key press
 * @param blocking - When true, the event will be dispatched to the registered target before being
 * dispatched to any EventTarget beneath it in the DOM tree. Defaults to false.
 * @param conditions - additional dynamic conditions to listen for
 */
export default function useEscapeKeyListener(
  onEscape: () => void,
  blocking?: boolean,
  ...conditions: any[]
) {
  useEffect(() => {
    // Trigger handler on ESC keypress
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        onEscape();
      }
    };
    document.addEventListener("keydown", handleEsc, blocking);
    return () => document.removeEventListener("keydown", handleEsc, blocking);
  }, [onEscape, blocking, ...conditions]);
}
