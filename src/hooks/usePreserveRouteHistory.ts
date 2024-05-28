import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LS_NEXT_PATH } from "utils/strings";

/**
 * Track and re-load the current page in case the window is lost. Will NOT
 * track window in the event of normal navigation away (e.g. user clicks link)
 */
export default function usePreserveRouteHistory() {
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(LS_NEXT_PATH, location.pathname);
    const unregister = () => {
      // remove "next" path if we're changing locations,
      // but not if the window is going to unload
      if (localStorage.getItem(LS_NEXT_PATH) === location.pathname) {
        localStorage.removeItem(LS_NEXT_PATH);
      }
    };
    return unregister;
  }, [location]);
}
