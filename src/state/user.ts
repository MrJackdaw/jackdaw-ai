import createState from "@jackcom/raphsducks";
import { InstanceKey } from "./state.utils";

/** Global user state */
export const UserStore = createState({
  initialized: false,
  anonymous: true,
  authenticated: false,
  avatar: "",
  email: "",
  lastSeen: "",
  // Use this when app is in a critical/failed state,
  // for example cannot reach the server (so e.g. login is down)
  criticalError: false
});

export type UserStoreInstance = ReturnType<typeof UserStore.getState>;
export type UserStoreInstanceKey = InstanceKey<UserStoreInstance>;
