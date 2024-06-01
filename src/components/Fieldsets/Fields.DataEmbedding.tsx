import useSettings from "hooks/useSettings";

/** @FormComponent Fields for User's Data Embedding settings */
export default function DataEmbeddingFields() {
  const { embedder } = useSettings(["embedder"]);

  return (
    <fieldset className="fields--data-embedding">
      <legend>Data Embedding</legend>

      <label>
        <span className="label">Embedding Model:</span>
        <input aria-readonly readOnly value={embedder} disabled />
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
            <span className="gold">This value is tied to your LLM because</span>{" "}
            each is unique: one LLM might not understand the content generated
            by another.
          </p>
        </div>
      </details>
    </fieldset>
  );
}
