import createState from "@jackcom/raphsducks";
import { notificationChannel } from "utils/general";

const SETTINGS_NOTIFICATIONS = "global.notifications";

/** Global notifications */
export const Notifications = createState({
  active: localStorage.getItem(SETTINGS_NOTIFICATIONS) !== "false",
  all: [] as Alert[]
});

export type NotificationsStore = ReturnType<typeof Notifications.getState>;
export type NotificationsStoreKey = keyof NotificationsStore;
export type Alert = {
  msg: string;
  time: number;
  persistent?: boolean;
  type?: "error" | "warning" | "info";
  error?: boolean;
  warning?: boolean;
};

/** Notification channels; allows the same ui/messages to be overwritten. Use Date for unique notification IDs */
export enum CHANNELS {
  MAIN = 1,
  WARNING = 20,
  ERROR = 30
}
/** Single dedicated notification channel for ALL worker notifications */
export const WORKER_CHANNEL =
  notificationChannel("Mbox.Worker") + CHANNELS.MAIN;

/** Check if alerts (UI only) are globally enabled */
export function notificationsActive() {
  return Notifications.getState().active;
}

/** Globally enable/disable alerts (UI only) */
export function toggleGlobalNotifications() {
  const { active } = Notifications.getState();
  Notifications.multiple({ active: !active, all: [] });
  localStorage.setItem(SETTINGS_NOTIFICATIONS, String(!active));
  if (!active) updateNotification("Notifications enabled!", 1);
}

export function addNotification(
  msg: string | Alert,
  persist = false,
  additional = {}
) {
  if (!notificationsActive() || !msg) return -1;
  const note = typeof msg === "string" ? createAlert(msg, persist) : msg;
  const { all: old } = Notifications.getState();
  const newAlerts = [...old, note];
  Notifications.multiple({ all: newAlerts, ...additional });
  return note.time;
}

export function resetNotifications(msg?: string, persist = false) {
  if (!notificationsActive()) return -1;
  const updates: Alert[] = [];
  let msgId;
  if (msg) {
    const notification = createAlert(msg, persist);
    msgId = notification.time;
    updates.push(notification);
  }
  Notifications.all(updates);
  return msgId;
}

export function removeNotification(msgID: Alert["time"]) {
  if (!notificationsActive()) return;
  const { all: notifications } = Notifications.getState();
  const i = notifications.findIndex((n) => n.time === msgID);
  if (i === -1) return;

  const updates = [...notifications];
  updates.splice(i, 1);
  Notifications.all(updates);
}

export function updateAsError(msg: string, id: number = CHANNELS.MAIN) {
  return updateAlert({ msg, id, type: "error", persist: true });
}

export function updateAsWarning(
  msg: string,
  id: number = CHANNELS.MAIN,
  p = true
) {
  return updateAlert({ msg, id, type: "warning", persist: p });
}

type UpdateAlertOpts = {
  msg?: string;
  id: number;
  persist?: boolean;
  type?: Alert["type"];
};

export function updateNotification(
  msg: string,
  id = CHANNELS.MAIN,
  persist = false,
  type: Alert["type"] = "info"
) {
  return updateAlert({ msg, id, persist, type });
}

/** Generalized helper for creating and updating `Alert` objects */
function updateAlert(opts: UpdateAlertOpts) {
  const { msg, id, persist = false, type = "info" } = opts;
  if (!msg || !notificationsActive()) return id || -1;
  const { all: notifications } = Notifications.getState();
  const msgIndex =
    id >= 0
      ? notifications.findIndex(({ time }) => time === id)
      : notifications.length;
  const newAlert = createAlert(msg, persist);
  newAlert.type = type;
  newAlert.persistent = persist;
  newAlert.time = id;

  const updates = [...notifications];
  if (msgIndex < 0) updates.push(newAlert);
  else updates[msgIndex] = newAlert;

  Notifications.all(updates);
  return newAlert.time;
}

function createAlert(msg: string, persistent = false): Alert {
  const a: Alert = {
    msg,
    time: new Date().getTime(),
    persistent,
    type: "info"
  };
  return a;
}
