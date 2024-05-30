import { User } from "utils/general";
import { UserStore } from "state/user";
import { updateAsWarning } from "state/notifications";
import {
  LS_ASSISTANT_KEY,
  LS_EMBEDDER_KEY,
  LS_OWNER_KEY,
  SETTING__USER_KEY
} from "utils/strings";
import {
  cacheUserSetting,
  deleteCachedSetting,
  getCachedUser
} from "indexedDB";
import { DateTime } from "luxon";
import { sessionFetch } from "./requests.shared";
import { refreshSettingsFromCache } from "state/settings-store";

/** Check if user is logged in */
export async function isUserAuthenticated() {
  const cached: User = await getCachedUser();
  if (cached) {
    const expires = DateTime.fromISO(cached.lastSeen).plus({ minutes: 30 });
    const stillAuthed = expires.toMillis() >= DateTime.now().toMillis();
    if (stillAuthed) return cached; // exit with cached user
    deleteCachedSetting(SETTING__USER_KEY);
  }

  return sessionFetch<{ user: User }>("get-user")
    .then(({ user }) => {
      if (user) cacheUserSetting(SETTING__USER_KEY, JSON.stringify(user));
      return user;
    })
    .catch(() => null);
}

let init = false;
export async function initializeUserState() {
  if (init) return;
  else init = true;

  try {
    migrateLegacyStorageKeys();
    const user = await isUserAuthenticated();
    if (user && !localStorage.getItem(LS_OWNER_KEY)) {
      localStorage.setItem(LS_OWNER_KEY, user.email);
    }
    UserStore.multiple({
      ...user,
      email: user?.email,
      authenticated: Boolean(user),
      criticalError: false,
      initialized: true
    });
    refreshSettingsFromCache();
  } catch (error) {
    updateAsWarning("Could not connect to server", undefined, false);
    UserStore.multiple({ criticalError: true, initialized: true });
  } finally {
    init = false;
  }
  return UserStore.getState();
}

/** Navigate user to oauth consent screen */
export async function startOAuthGoogle() {
  const { url } = await sessionFetch<{ url: string }>("oauth:google");
  if (url) window.open(url, "_self");
}

/** Complete OAuth login flow */
export async function completeOAuthFlow(hash: string) {
  return sessionFetch("oauth:complete", { hash });
}

/** Logout */
export async function logoutUser() {
  return Promise.all([
    sessionFetch("session:logout"),
    deleteCachedSetting(SETTING__USER_KEY)
  ]).then(() => UserStore.reset());
}

/**
 * Initialize required LocalStorage keys: replace/update/remove any deprecated items */
function migrateLegacyStorageKeys() {
  if (!localStorage.getItem(LS_EMBEDDER_KEY))
    localStorage.setItem(LS_EMBEDDER_KEY, "huggingface");
  if (!localStorage.getItem(LS_ASSISTANT_KEY))
    localStorage.setItem(LS_ASSISTANT_KEY, "huggingface");
}
