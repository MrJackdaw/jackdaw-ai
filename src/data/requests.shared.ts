import {
  User,
  SESSION_URL,
  AUTH_OPTS,
  SUPABASE_URL,
  JACKCOM_AI_URL
} from "utils/general";
import { SessionAction, DataAction, AssistantAction } from "./requests.types";
import { cacheUserSetting } from "indexedDB";
import { SETTING__USER_KEY } from "utils/strings";
import { SettingsStore } from "state/settings-store";

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
    .then(returnOrRefetch(() => sessionFetch(action, data), isAuthIntent));
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
    .then(returnOrRefetch(() => cloudDataFetch(action, data)));
}

type LLMResponse = {
  data: { content: string; llmOutput?: Record<string, any> };
};

/** Standardized request for AI-related requests */
export async function assistantActionFetch(
  action: AssistantAction,
  data?: any
): Promise<LLMResponse> {
  const { assistantLLM } = SettingsStore.getState();
  const body = JSON.stringify({ action, data, assistantLLM });

  return fetch(JACKCOM_AI_URL, { ...AUTH_OPTS, body })
    .then((d) => d.json())
    .then(checkSessionExpired)
    .then(returnOrRefetch(() => assistantActionFetch(action, data)));
}

/**
 * Generates a promise handler for either handling a refreshed-session response or
 * calling the "fetch" function that was interrupted by an expired session */
function returnOrRefetch<T = any>(
  refetchFn: { (a?: any): any },
  isAuthIntent = false
) {
  return (v?: User | T) => {
    // refetch data (depending on whether session was/wasn't refreshed)
    if (!v) return null;
    if ((v as User).authenticated && !isAuthIntent) return refetchFn();
    return v;
  };
}

type ServerResponse = { message: string } & Record<string, any>;
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

function checkSessionExpired<T extends ServerResponse>(v: T) {
  if (v.message === "Session Expired") return refreshUserSession();
  return v;
}
