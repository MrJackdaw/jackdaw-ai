import createState from "@jackcom/raphsducks";

/**
 * Module State. This is a copy of the Service Worker's state.
 * When the service worker updates state, the UI receives a message
 * that is passed into a state update here:
 *
 * MBoxStore.multiple( messageFromWorker );
 */
export const MBoxStore = createState({
  initialized: false,
  docsCount: 0,
  messagesLoaded: false,
  vectorStoreLoaded: false,
  loading: false,
});

export type MBoxStoreInstance = ReturnType<typeof MBoxStore.getState>;
export type MBoxStoreInstanceKey = keyof MBoxStoreInstance;
