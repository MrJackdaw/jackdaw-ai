import ChatModule from "components/ChatModule";
import useModal from "hooks/useModal";
import { useEffect } from "react";
import { ModalStore } from "state/modal";
import { SettingsStore } from "state/settings-store";

let loadedOnce = false;

/** Inbox-Reader route */
export default function MBoxRoute() {
  const { active, MODAL, setModal } = useModal();

  useEffect(() => {
    if (SettingsStore.getState().owner) {
      return void (loadedOnce = true);
    }
    if (!loadedOnce && active !== MODAL.WELCOME_USER)
      setModal(MODAL.WELCOME_USER);

    // if (messagesLoaded && vectorStoreLoaded && !loadedOnce) loadedOnce = true;
    return ModalStore.subscribeOnce(
      () => void (loadedOnce = true),
      "active",
      (v) => v === MODAL.NONE
    );
  }, []);

  return (
    <section className="route route--mbox">
      <ChatModule />
    </section>
  );
}
