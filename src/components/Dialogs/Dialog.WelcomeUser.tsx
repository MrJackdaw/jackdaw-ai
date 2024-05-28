import { FormEventHandler, useEffect, useMemo, useState } from "react";
import useSettings from "hooks/useSettings";
import MboxFileLoader from "components/Mbox.FileLoader";
import { changeMboxOwner } from "mbox/Mbox";
import Dialog from "./Dialog.Default";
import { clearModal } from "state/modal";
import { useMboxStore } from "hooks/useMboxStore";

export default function WelcomeUserDialog() {
  const { owner } = useSettings(["owner"]);
  const { loading } = useMboxStore(["loading"]);
  const [userHandle, setUserHandle] = useState(owner);
  const showFileLoadingInstructions = useMemo(() => Boolean(owner), [owner]);
  const onNewUserHandle: FormEventHandler = (e) => {
    e.preventDefault();
    changeMboxOwner(userHandle);
    clearModal();
  };

  useEffect(() => {
    if (loading) return clearModal();
    setUserHandle(owner);
  }, [owner, loading]);

  return (
    <Dialog
      open
      data-medium
      materialIcon="psychology_alt"
      title={owner ? `Hello, ${owner}` : "Welcome"}
      sticky
    >
      {showFileLoadingInstructions ? (
        <p>
          Load and analyze <b>documents</b> with the help of your{" "}
          <span className="gold">Virtual Assistant</span>. You can use your own
          OpenAI API key, if you have one.
        </p>
      ) : (
        <p>
          Please enter an identifier so the Virtual Assistant knows who you are.
        </p>
      )}

      {owner ? (
        <MboxFileLoader onParserNotified={() => clearModal()} />
      ) : (
        <form onSubmit={onNewUserHandle}>
          <label>
            <input
              className="wide"
              type="text"
              placeholder="Email address or display name"
              value={userHandle}
              onChange={({ target }) => setUserHandle(target.value)}
            />
          </label>

          {userHandle.length >= 3 && (
            <button className="wide">Set Handle</button>
          )}
        </form>
      )}

      <details>
        <summary>
          <span className="material-symbols-outlined">warning</span>
          <span>Under Development</span>
        </summary>

        <div className="hint">
          This app currently expects mailbox ('mbox'/.mbox) files. Others will
          be supported in the future. Data is stored in your browser, unless you
          create an account AND enable cloud storage.
        </div>
      </details>
    </Dialog>
  );
}
