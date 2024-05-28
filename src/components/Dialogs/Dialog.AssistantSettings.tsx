import { FormEventHandler, useEffect, useMemo, useState } from "react";
import { updateUserSettings } from "utils/general";
import { clearModal } from "state/modal";
import { SettingsStore, refreshSettingsFromCache } from "state/settings-store";
import { updateNotification } from "state/notifications";
import useEscapeKeyListener from "hooks/useEscapeKeyListener";
import TabbedInterface from "components/TabbedInterface";
import AssistantLLMFields from "components/Fieldsets/Fields.AssistantSettings";
import DataEmbeddingFields from "components/Fieldsets/Fields.DataEmbedding";
import ManageVectorStorageFields from "components/Fieldsets/Fields.ManageVectorStorage";
import Dialog from "./Dialog.Default";
import "./Dialog.AssistantSettings.scss";

/** @Modal Settings for Virtual Assistant */
export default function AssistantSettingsDialog({ open }: { open?: boolean }) {
  const [local, setLocal] = useState(SettingsStore.getState());
  const [activeTab, setActiveTab] = useState(0);
  const invalid = useMemo(() => {
    const { assistantAPIKey, embedderAPIKey, assistantLLM, embedder } = local;
    if (embedder === "openai") return embedderAPIKey?.length < 10;
    if (assistantLLM?.startsWith("openAI")) return assistantAPIKey?.length < 10;
    return false;
  }, [local.embedder, local.embedderAPIKey]);
  const confirmUpdateSettings = () => {
    updateUserSettings(SettingsStore.getState());
    refreshSettingsFromCache();
    clearModal();
    setTimeout(() => updateNotification("Settings updated"));
  };
  const handleSaveForm: FormEventHandler = (e) => {
    e.preventDefault();
    confirmUpdateSettings();
  };

  // Lifecycle: close modal on escape
  useEscapeKeyListener(clearModal);

  useEffect(() => {
    const unsubscribe = SettingsStore.subscribe(() => {
      setLocal(SettingsStore.getState());
    });

    // Unsubscribe AND wipe the shared store, since it is exclusive to this modal
    return () => {
      unsubscribe();
      refreshSettingsFromCache();
    };
  }, []);

  return (
    <Dialog
      id="dialog--global-settings"
      open={open}
      onClose={clearModal}
      data-medium
      showControls
      disableConfirmation={invalid}
      onConfirm={confirmUpdateSettings}
      title="Assistant Settings"
      materialIcon="psychology"
    >
      <form className="form--assistant-settings" onSubmit={handleSaveForm}>
        <TabbedInterface
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { label: "Assistant", icon: "psychology" },
            { label: "Embeddings", icon: "polyline" },
            { label: "Vector Storage", icon: "sim_card" }
          ]}
        >
          <AssistantLLMFields />

          <DataEmbeddingFields />

          <ManageVectorStorageFields />
        </TabbedInterface>

        <hr />

        {local.embedder === "openai" && activeTab <= 1 && (
          <fieldset>
            <legend
              aria-required
              className={local.embedderAPIKey ? undefined : "error"}
            >
              OpenAI API Key
            </legend>

            <label>
              <input
                type="password"
                placeholder="Enter API Key (required)"
                value={local.embedderAPIKey}
                onChange={(e) =>
                  SettingsStore.multiple({
                    embedderAPIKey: e.target.value,
                    assistantAPIKey: e.target.value
                  })
                }
              />
            </label>
            <span className="hint">
              Stored in your browser, and used to make requests on your behalf.
            </span>
          </fieldset>
        )}
      </form>
    </Dialog>
  );
}
