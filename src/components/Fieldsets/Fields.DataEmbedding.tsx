import { AISource, updateUserSettings } from "utils/general";
import { useEffect, useState } from "react";
import { SettingsStoreInstance, SettingsStore } from "state/settings-store";

/** @FormComponent Fields for User's Data Embedding settings */
export default function DataEmbeddingFields() {
  const isOpenAI = /^(openai)/gi;
  const [embedder, setEmbedder] = useState<AISource>(
    SettingsStore.getState().embedder ?? "huggingface"
  );
  const onEmbeddingModel = (newEmbedder: AISource = "huggingface") => {
    const { embedderAPIKey } = SettingsStore.getState();
    const openAIEmbedder = isOpenAI.test(newEmbedder);
    const updates: Partial<SettingsStoreInstance> = { embedder: newEmbedder };

    if (openAIEmbedder) {
      updates.assistantLLM = "openAI3_5T";
      updates.assistantAPIKey = embedderAPIKey ?? "";
    } else {
      updates.embedderAPIKey = updates.assistantAPIKey = "";
      updates.assistantLLM =
        newEmbedder === "huggingface" ? "huggingface" : "ollama";
    }

    SettingsStore.multiple(updates);
    updateUserSettings(SettingsStore.getState());
  };

  useEffect(
    () =>
      SettingsStore.subscribeToKeys(
        (x) => setEmbedder(x.embedder),
        ["embedder"]
      ),
    []
  );

  return (
    <fieldset className="fields--data-embedding">
      <legend>Data Embedding</legend>

      <label>
        <span className="label">Embedding Model:</span>

        <select
          onChange={(e) => onEmbeddingModel?.(e.target.value as AISource)}
          value={embedder}
        >
          <option value="huggingface">huggingface</option>
          <option value="openai">openai</option>
        </select>
      </label>

      <details className="button--details">
        <summary>
          <span className="material-symbols-outlined">help</span>
          <span>
            What are <span className="gold">Embeddings</span>?
          </span>
        </summary>

        <div className="hint">
          <p>
            <span className="gold">Embeddings</span> help to give your{" "}
            <span className="gold">Assistant</span> additional targeted context
            based on your query. Select{" "}
            <span className="gold">huggingface</span>
            to generate them on your computer, or via an online service like
            OpenAI.
          </p>
          <p>
            <b>Note that</b> Embeddings are linked to your{" "}
            <span className="gold">Assistant</span>: changing this value will
            affect the other.
          </p>
        </div>
      </details>
    </fieldset>
  );
}
