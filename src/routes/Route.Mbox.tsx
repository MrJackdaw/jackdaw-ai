import ChatModule from "components/ChatModule";
import useModal from "hooks/useModal";
import { useEffect } from "react";
import { ModalStore } from "state/modal";

let loadedOnce = false;

/** Inbox-Reader route */
export default function MBoxRoute() {
  const { active, MODAL, setModal } = useModal();

  useEffect(() => {
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
