import createState from "@jackcom/raphsducks";

export enum MODAL {
  NONE,
  MANAGE_PROJECT,
  PREVIEW_IMAGE,
  SETTINGS_GLOBAL,
  WELCOME_USER
}

/** Globally-visible modal state */
export const ModalStore = createState({
  active: MODAL.NONE,
  previous: [] as MODAL[],
  image: "",
  description: ""
});

export type ModalStoreInstance = ReturnType<typeof ModalStore.getState>;
export type ModalStoreInstanceKey = keyof ModalStoreInstance;

/** Clear globally-visible modal */
export function clearModal(preserveHistory = false) {
  if (!preserveHistory || typeof preserveHistory !== "boolean")
    return ModalStore.active(MODAL.NONE);

  const { previous: old, active: replacing } = ModalStore.getState();
  const previous = [...old];
  const active = previous.pop() || MODAL.NONE;
  if (active === replacing) return;
  ModalStore.multiple({ active, previous });
}

/** Set globally-visible modal */
export function setModal(active: MODAL) {
  const { active: last } = ModalStore.getState();
  if (active === last) return;
  const previous = previewNextModalState();
  ModalStore.multiple({ active, previous });
}

/** Set globally-visible image */
export function setDialogImage(url?: string) {
  if (!url) return clearModal(true);

  ModalStore.multiple({
    image: url,
    active: MODAL.PREVIEW_IMAGE,
    previous: previewNextModalState()
  });
}

/**
 * Generate list of previously-active modals. `Preview` because it includes the
 * currently-active modal in the response. */
function previewNextModalState() {
  const { previous: old, active: last } = ModalStore.getState();
  return [...old, last].slice(10);
}
