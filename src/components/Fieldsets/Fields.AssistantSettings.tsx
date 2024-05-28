import { llmsForAISource } from "chains/Models";
import { useEffect, useState } from "react";
import { SettingsStore, SettingsStoreInstance } from "state/settings-store";

/** @FormComponent Child component of `AssistantSettingsModal` form */
export default function AssistantLLMFields() {
  const isOpenAI = /^(openai)/gi;
  const [assistantLLM, setAssistantLLM] = useState(
    SettingsStore.getState().assistantLLM
  );
  const LLMs = llmsForAISource();
  const onAssistantLLM = (newLLM = "ollama") => {
    const { embedderAPIKey, assistantAPIKey } = SettingsStore.getState();
    const openAILLM = isOpenAI.test(newLLM);
    const updates: Partial<SettingsStoreInstance> = { assistantLLM: newLLM };

    if (openAILLM) {
      // change match embedder
      updates.embedder = "openai";
      updates.embedderAPIKey = updates.assistantAPIKey =
        embedderAPIKey ?? assistantAPIKey;
    } else {
      updates.embedderAPIKey = updates.assistantAPIKey = "";
      if (newLLM === "huggingface") updates.embedder = "huggingface";
    }

    SettingsStore.multiple(updates);
  };

  useEffect(
    () =>
      SettingsStore.subscribeToKeys(
        (x) => setAssistantLLM(x.assistantLLM),
        ["assistantLLM"]
      ),
    []
  );

  return (
    <fieldset className="fields--assistant-settings">
      <legend>Assistant LLM</legend>

      <label>
        <span className="label">Language Model:</span>

        <select
          // onChange={({ target }) => props.onAssistantLLM?.(target.value)}
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
            What is the <b className="grey">Assistant LLM</b>?
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
