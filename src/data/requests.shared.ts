import { User, SESSION_URL, AUTH_OPTS, SUPABASE_URL } from "utils/general";
import { SessionAction, DataAction } from "./requests.types";
import { cacheUserSetting } from "indexedDB";
import { SETTING__USER_KEY } from "utils/strings";

/** Standardized request for session-related queries (supabase) */
export async function sessionFetch<T = any>(
  action: SessionAction,
  data?: any
): Promise<T> {
  const body = JSON.stringify({ action, data });
  const isAuthIntent = [
    "oauth:complete",
    "oauth:google",
    "session:refresh"
  ].includes(action);

  return fetch(SESSION_URL, { ...AUTH_OPTS, body })
    .then((d) => d.json())
    .then(checkSessionExpired)
    .then((v) => {
      // refetch data (depending on whether session was/wasn't refreshed)
      if (!v) return null;
      if ((v as User).authenticated && !isAuthIntent)
        return sessionFetch(action, data);
      return v;
    });
}

/** Standardized request for data-related queries (supabase) */
export async function cloudDataFetch<T>(
  action: DataAction,
  data?: any
): Promise<T> {
  const body = JSON.stringify({ action, data });
  return fetch(SUPABASE_URL, { ...AUTH_OPTS, body })
    .then((d) => d.json())
    .then(checkSessionExpired)
    .then((v) => {
      // refetch data (depending on whether session was/wasn't refreshed)
      if (!v) return null;
      if ((v as User).email) return cloudDataFetch(action, data);
      return v;
    });
}

let localRefreshFailed = false;
let refreshing = false;
async function refreshUserSession() {
  if (localRefreshFailed || refreshing) return null;
  refreshing = true;

  try {
    const { user } = await sessionFetch<{ user: User }>("session:refresh");
    if (user) cacheUserSetting(SETTING__USER_KEY, JSON.stringify(user));
    refreshing = false;
    return user;
  } catch (error) {
    localRefreshFailed = true;
    return null;
  }
}

export function checkSessionExpired<
  T extends { message: string } & Record<string, any>
>(v: T) {
  if (v.message === "Session Expired") return refreshUserSession();
  return v;
}
