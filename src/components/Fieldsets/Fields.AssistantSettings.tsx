import { useMemo } from "react";
import { llmsForAISource } from "chains/Models";
import { SettingsStore, SettingsStoreInstance } from "state/settings-store";
import useSettings from "hooks/useSettings";
import {
  AISource,
  isJackCOMStr,
  isOpenAIStr,
  updateUserSettings
} from "utils/general";

/** @FormComponent Child component of `AssistantSettingsModal` form */
export default function AssistantLLMFields() {
  const { assistantLLM, enableCloudStorage } = useSettings([
    "assistantLLM",
    "enableCloudStorage"
  ]);
  const LLMs = useMemo(() => llmsForAISource(), [enableCloudStorage]);
  const onAssistantLLM = (newLLM = "ollama") => {
    const { embedderAPIKey, assistantAPIKey } = SettingsStore.getState();
    const updates: Partial<SettingsStoreInstance> = { assistantLLM: newLLM };

    if (isOpenAIStr(newLLM)) {
      // change match embedder
      updates.embedder = isJackCOMStr(newLLM) ? "@jackcom/openai-3" : "openai";
      updates.embedderAPIKey = updates.assistantAPIKey =
        embedderAPIKey ?? assistantAPIKey;
    } else {
      updates.embedderAPIKey = updates.assistantAPIKey = "";
      updates.embedder = newLLM as AISource;
    }

    SettingsStore.multiple(updates);
    updateUserSettings(SettingsStore.getState());
  };

  return (
    <fieldset className="fields--assistant-settings">
      <legend>Assistant LLM</legend>

      <label>
        <span className="label">Language Model:</span>

        <select
          onChange={({ target }) => onAssistantLLM(target.value)}
          value={assistantLLM}
        >
          {LLMs.map((llm) => (
            <option key={llm} value={llm}>
              {llm}
            </option>
          ))}
        </select>
      </label>

      <details className="button--details">
        <summary>
          <span className="material-symbols-outlined">help</span>
          <span>
            What is the <span className="gold">Assistant LLM</span>?
          </span>
        </summary>
        <p className="hint">
          This is the underlying <span className="gold">Language Model</span>{" "}
          that will help you summarize findings from your inbox.{" "}
          <span className="gold">Ollama</span> is an external tool that helps
          you download and run different LLMs on your computer.
        </p>
      </details>
    </fieldset>
  );
}
