import createState from "@jackcom/raphsducks";
import {
  getUserSettings,
  LocalUserSettings,
  updateUserSettings
} from "utils/general";

export const SettingsStore = createState<LocalUserSettings>(getUserSettings());
export type SettingsStoreInstance = ReturnType<typeof SettingsStore.getState>;
export type SettingsStoreKey = keyof SettingsStoreInstance;

/**
 * Change user vector-storage target. When `enableCloudStorage` is true, the
 * app will attempt to store user data to the user's selected Supabase project */
export function toggleOnlineVectorStore() {
  const { enableCloudStorage } = SettingsStore.getState();
  SettingsStore.enableCloudStorage(!enableCloudStorage);
  updateUserSettings(SettingsStore.getState());
}

/** Reload state with local-storage changes */
export function refreshSettingsFromCache() {
  return SettingsStore.multiple(getUserSettings());
}
