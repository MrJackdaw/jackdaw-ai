import Dexie from "dexie";
import { SETTING__USER_KEY } from "utils/strings";
import {
  cacheValue,
  deleteCachedValue,
  getCachedValue
} from "./db.shared-utils";

type UserSettings = {
  key: string;
  value: string;
  expires?: number;
};

/** Storage for generalized user settings. */
class SettingsDB extends Dexie {
  public settings: Dexie.Table<UserSettings, string>;

  constructor() {
    super("SettingsDB");
    this.version(1).stores({ settings: "key,value,expires" });
    this.settings = this.table("settings");
  }
}

const settingsDB = new SettingsDB();
export default settingsDB;

export async function cacheUserSetting(
  key: string,
  value: string,
  maxAgeSeconds?: number
): Promise<void> {
  const db = settingsDB.settings;
  return cacheValue({ key, value, maxAgeSeconds, db });
}

export async function deleteCachedSetting(key: string) {
  return deleteCachedValue(key, settingsDB.settings);
}

export async function getCachedSetting(key: string) {
  return getCachedValue(key, settingsDB.settings).then( x => x?.value);
}

export async function getCachedUser() {
  const userStr = await getCachedSetting(SETTING__USER_KEY);
  if (!userStr) return null;
  try {
    const userJS = JSON.parse(userStr);
    return userJS;
  } catch (error) {
    return null;
  }
}
