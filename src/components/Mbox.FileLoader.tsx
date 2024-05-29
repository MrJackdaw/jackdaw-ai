import { useMemo, useRef } from "react";
import { SettingsStore } from "state/settings-store";
import { sendParserMessage } from "mbox/Mbox";
import { useMboxStore } from "hooks/useMboxStore";
import { updateAsError, updateNotification } from "state/notifications";
import { notificationChannel } from "utils/general";
import "./Mbox.FileLoader.scss";

const CHANNEL = notificationChannel("Mbox.FileLoader");

type Props = {
  /** Notify parent when file has been sent to `Parser` worker thread */
  onParserNotified?: { (fileName: string): void };
};

/** @FormComponent File selector for .mbox files */
const MboxFileLoader = (props: Props) => {
  const { loading, messagesLoaded, docsCount } = useMboxStore([
    "loading",
    "messagesLoaded",
    "docsCount"
  ]);
  const btnText = useMemo(() => {
    if (!messagesLoaded) return "Load Inbox";
    if (docsCount === 0) return "Inbox is Empty";
    return `Messages Loaded`;
  }, [messagesLoaded, docsCount]);
  const $inputRef = useRef<HTMLInputElement>(null);
  const onFiles = async (files: FileList | null) => {
    const [uploadedFile] = files ?? [];
    if (!uploadedFile) return;

    try {
      const { owner } = SettingsStore.getState();
      updateNotification("Loading inbox...", undefined, true);
      sendParserMessage("Mbox.parseFile", { file: uploadedFile, owner });
      props.onParserNotified?.(uploadedFile.name);
    } catch (error) {
      const errorM = (error as Error)?.message ?? error?.toString();
      const fullM = `MboxFileLoader.onFiles.Error::${errorM ?? "No details"}`;
      updateAsError(fullM, CHANNEL);
    }
  };

  const openFileSelection = () => {
    if ($inputRef.current) $inputRef.current.click();
  };
  const $loadNewElem = (
    <a role="button" style={{ cursor: "pointer" }} onClick={openFileSelection}>
      Load new Inbox
    </a>
  );
  const $fileInputElem = (
    <input
      type="file"
      hidden
      ref={$inputRef}
      onChange={({ currentTarget }) => onFiles(currentTarget.files)}
    />
  );

  if (loading)
    return (
      <p className="file-loader--info">
        <span className="spinner--before">
          Loading file...
          {$loadNewElem}
          {$fileInputElem}
        </span>
      </p>
    );

  if (messagesLoaded)
    return (
      <p className="file-loader--info">
        {btnText}. {$loadNewElem}
        {$fileInputElem}
      </p>
    );

  return (
    <form className="file-loader--form" onSubmit={(e) => e.preventDefault()}>
      <label>
        <button
          className={`wide button--grid ${
            messagesLoaded ? "" : "pulse"
          }`.trim()}
          onClick={openFileSelection}
        >
          <span className="material-symbols-outlined">upload</span>
          <span>{btnText}</span>
        </button>
      </label>

      {$fileInputElem}
    </form>
  );
};

export default MboxFileLoader;
