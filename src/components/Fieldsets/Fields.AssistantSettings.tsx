import { useMemo } from "react";
import { llmsForAISource } from "chains/Models";
import { SettingsStore, SettingsStoreInstance } from "state/settings-store";
import useSettings from "hooks/useSettings";
import {
  AISource,
  isJackCOMStr,
  isOpenAIStr,
  isTogetherAIStr,
  updateUserSettings
} from "utils/general";
import { updateNotification } from "state/notifications";

/** @FormComponent Child component of `AssistantSettingsModal` form */
export default function AssistantLLMFields() {
  const { assistantLLM, enableCloudStorage } = useSettings([
    "assistantLLM",
    "enableCloudStorage"
  ]);
  const LLMs = useMemo(() => {
    const all = llmsForAISource();
    const jackcom: string[] = [];
    const together: string[] = [];
    const openai: string[] = [];

    all.forEach((llm) => {
      if (isOpenAIStr(llm)) openai.push(llm);
      if (isJackCOMStr(llm)) jackcom.push(llm);
      if (isTogetherAIStr(llm)) together.push(llm);
    });

    const values: [label: string, vals: string[]][] = [];
    if (jackcom.length) values.push(["@JackCOM", jackcom]);
    if (openai.length) values.push(["OpenAI (+ your API Key)", openai]);
    if (together.length) values.push(["TogetherAI (+ your API Key)", together]);
    return values;
  }, [enableCloudStorage]);
  const onAssistantLLM = (newLLM: AISource = "openai") => {
    const { assistantLLM: prev } = SettingsStore.getState();
    const clearAPIKey =
      (isTogetherAIStr(prev) && !isTogetherAIStr(newLLM)) ||
      (isJackCOMStr(prev) && !isJackCOMStr(newLLM)) ||
      (isOpenAIStr(prev) && !isOpenAIStr(newLLM));

    // Match embedder to assistant
    const updates: Partial<SettingsStoreInstance> = { assistantLLM: newLLM };
    updates.embedder = isOpenAIStr(newLLM) ? "openai" : newLLM;
    if (clearAPIKey) updates.aiProviderAPIKey = "";

    SettingsStore.multiple(updates);
    updateUserSettings(SettingsStore.getState());
    updateNotification(`Changed assistant to ${newLLM}`);
  };

  return (
    <fieldset className="fields--assistant-settings">
      <legend>Assistant LLM</legend>

      <label>
        <span className="label">Language Model:</span>

        <select
          onChange={({ target }) => onAssistantLLM(target.value as AISource)}
          value={assistantLLM}
        >
          {LLMs.map(([groupname, group]) => (
            <optgroup label={groupname} key={groupname}>
              {group.map((llm) => (
                <option key={llm} value={llm}>
                  {llm}
                </option>
              ))}
            </optgroup>
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
