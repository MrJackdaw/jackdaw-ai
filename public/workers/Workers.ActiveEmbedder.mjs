import {
  HFEmbedder,
  JOpenAIEmbedder,
  JTogetherAIEmbedder,
  OpenAIEmbedder
} from "./Workers.Models";
import { MboxWorkerSettings, exportWorkerAlert } from "./Workers.State.mjs";

/** @type {AsyncSingleton} Active embedding (user can conditionally override) */
let activeEmbedder = null;
/**
 * Get active embeddings model (allows user to override with
 * huggingface (local), personal open-ai, or proxy-openai (jackcom))
 * @returns {Promise<AsyncSingleton>} */
export async function getEmbedder() {
  return activeEmbedder || setActiveEmbedder("huggingface");
}

/**
 * Override active embedder class (user can conditionally override)
 * @param {"@jackcom/openai-3"|"@jackcom/openai-4T"|"@jackcom/openai-4o"|"@jackcom/mistral-7B"|"@jackcom/llama3-8B"|"@jackcom/code-llama3-7Bi"|"@jackcom/striped-hyena-7B"|"huggingface"|"openai"} e New Embedder model target
 * @param {string?} apiKey  Optional API key for AI service provider */
export async function setActiveEmbedder(e, apiKey = "") {
  // Update shared worker settings state
  MboxWorkerSettings.multiple({ embedder: e, aiProviderAPIKey: apiKey });

  const opts = { apiKey, llmTarget: e };

  switch (e) {
    case "@jackcom/openai-3":
    case "@jackcom/openai-4T":
    case "@jackcom/openai-4o": {
      activeEmbedder = await JOpenAIEmbedder.getInstance(e);
      return activeEmbedder;
    }

    case "@togetherAI/mistral-7B":
    case "@togetherAI/llama3-8B":
    case "@togetherAI/code-llama3-7Bi":
    case "@togetherAI/striped-hyena-7B": {
      // requires user to provide their own API key
      if (!apiKey)
        return exportWorkerAlert("Please set your TogetherAI API key!", "Error");
      activeEmbedder = await JTogetherAIEmbedder.getInstance(opts);
      return activeEmbedder;
    }

    case "huggingface": {
      activeEmbedder = await HFEmbedder.getInstance();
      return activeEmbedder;
    }

    case "openai": {
      // requires user to provide their own API key
      if (!apiKey)
        return exportWorkerAlert("Please set your OpenAI API key!", "Error");
      activeEmbedder = await OpenAIEmbedder.getInstance(opts);
      return activeEmbedder;
    }

    default: {
      let err = `${e} is an unsupported Embedding Model!`;
      err = `${err} Please select a different model in your "Assistant Settings."`;
      exportWorkerAlert(err, "Error");
      return activeEmbedder;
    }
  }
}
