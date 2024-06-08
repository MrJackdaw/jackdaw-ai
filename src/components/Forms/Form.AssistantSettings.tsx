import { FormEventHandler, useEffect, useMemo } from "react";
import {
  isOpenAIStr,
  isTogetherAIStr,
  updateUserSettings
} from "utils/general";
import { clearModal } from "state/modal";
import { SettingsStore, refreshSettingsFromCache } from "state/settings-store";
import { updateNotification } from "state/notifications";
import useSettings from "hooks/useSettings";
import AssistantLLMFields from "components/Fieldsets/Fields.AssistantSettings";
import DataEmbeddingFields from "components/Fieldsets/Fields.DataEmbedding";
import "./Form.AssistantSettings.scss";

/** @Modal Settings for Virtual Assistant */
export default function AssistantSettingsForm() {
  const settings = useSettings([
    "aiProviderAPIKey",
    "assistantLLM",
    "embedder"
  ]);
  const { embedder, aiProviderAPIKey, assistantLLM } = settings;
  const requireAPIKey = useMemo(
    () => isOpenAIStr(embedder) || isTogetherAIStr(embedder),
    [embedder, assistantLLM]
  );
  const confirmUpdateSettings = () => {
    updateUserSettings(SettingsStore.getState());
    clearModal();
    setTimeout(() => updateNotification("Settings updated"));
  };
  const handleChangeKey = (e: string) => {
    SettingsStore.multiple({ aiProviderAPIKey: e });
    confirmUpdateSettings();
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

      {requireAPIKey && (
        <fieldset>
          <legend className={aiProviderAPIKey ? undefined : "error"}>
            <span className="label required">API Key</span>
          </legend>

          <label>
            <input
              type="password"
              placeholder="Enter API Key (required)"
              value={aiProviderAPIKey}
              onChange={(e) => handleChangeKey(e.target.value)}
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
