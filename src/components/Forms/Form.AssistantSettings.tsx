import { FormEventHandler, useEffect, useState } from "react";
import { updateUserSettings } from "utils/general";
import { clearModal } from "state/modal";
import { SettingsStore, refreshSettingsFromCache } from "state/settings-store";
import { updateNotification } from "state/notifications";
import AssistantLLMFields from "components/Fieldsets/Fields.AssistantSettings";
import DataEmbeddingFields from "components/Fieldsets/Fields.DataEmbedding";
import "./Form.AssistantSettings.scss";

/** @Modal Settings for Virtual Assistant */
export default function AssistantSettingsForm() {
  const [local, setLocal] = useState(SettingsStore.getState());
  const [activeTab] = useState(0);
  const confirmUpdateSettings = () => {
    updateUserSettings(SettingsStore.getState());
    clearModal();
    setTimeout(() => updateNotification("Settings updated"));
  };
  const handleSaveForm: FormEventHandler = (e) => {
    e.preventDefault();
    confirmUpdateSettings();
  };

  useEffect(() => {
    const unsubscribe = SettingsStore.subscribe(() => {
      setLocal(SettingsStore.getState());
    });

    // Unsubscribe AND wipe the shared store
    return () => {
      unsubscribe();
      refreshSettingsFromCache();
    };
  }, []);

  return (
    <form className="form--assistant-settings" onSubmit={handleSaveForm}>
      <AssistantLLMFields />

      <DataEmbeddingFields />

      <hr />

      {local.embedder === "openai" && activeTab <= 1 && (
        <fieldset>
          <legend className={local.embedderAPIKey ? undefined : "error"}>
            <span className="label required">API Key</span>
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
  );
}
