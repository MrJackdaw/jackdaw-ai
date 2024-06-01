import { AISource } from "utils/general";
import { useEffect, useState } from "react";
import { SettingsStore } from "state/settings-store";

/** @FormComponent Fields for User's Data Embedding settings */
export default function DataEmbeddingFields() {
  const [embedder, setEmbedder] = useState<AISource>(
    SettingsStore.getState().embedder ?? "huggingface"
  );

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

        <select aria-readonly value={embedder} disabled>
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
            <span className="gold">
              Embeddings are relationships between the information you create.
            </span>{" "}
            They give your <span className="gold">Assistant</span> additional
            targeted context when you ask a question.{" "}
            <span className="gold">They are linked to your LLM because</span>{" "}
            each might have a unique way of generating those relationships.
          </p>
        </div>
      </details>
    </fieldset>
  );
}
