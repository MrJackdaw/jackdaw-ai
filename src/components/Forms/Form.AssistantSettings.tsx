import { FormEventHandler, useEffect, useMemo } from "react";
import { updateUserSettings } from "utils/general";
import { clearModal } from "state/modal";
import { SettingsStore, refreshSettingsFromCache } from "state/settings-store";
import { updateNotification } from "state/notifications";
import useSettings from "hooks/useSettings";
import AssistantLLMFields from "components/Fieldsets/Fields.AssistantSettings";
import DataEmbeddingFields from "components/Fieldsets/Fields.DataEmbedding";
import "./Form.AssistantSettings.scss";

/** @Modal Settings for Virtual Assistant */
export default function AssistantSettingsForm() {
  const isJackCOM = /^(@jackcom\/)/;
  const isOpenAI = /(openai)/;
  const { embedder, embedderAPIKey, assistantLLM } = useSettings([
    "assistantAPIKey",
    "assistantLLM",
    "embedderAPIKey",
    "embedder"
  ]);
  const requireAPIKey = useMemo(
    () => isOpenAI.test(embedder) && !isJackCOM.test(embedder),
    [embedder, assistantLLM]
  );
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
    return refreshSettingsFromCache;
  }, []);

  return (
    <form className="form--assistant-settings" onSubmit={handleSaveForm}>
      <AssistantLLMFields />

      <DataEmbeddingFields />

      <hr />

      {requireAPIKey && (
        <fieldset>
          <legend className={embedderAPIKey ? undefined : "error"}>
            <span className="label required">API Key</span>
          </legend>

          <label>
            <input
              type="password"
              placeholder="Enter API Key (required)"
              value={embedderAPIKey}
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
