import { HFEmbedder, JOpenAIEmbedder, OpenAIEmbedder } from "./Workers.Models";
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
  MboxWorkerSettings.multiple({ embedder: e, embedderAPIKey: apiKey });

  switch (e) {
    case "@jackcom/openai-3":
    case "@jackcom/openai-4T":
    case "@jackcom/openai-4o":
    case "@jackcom/mistral-7B":
    case "@jackcom/llama3-8B":
    case "@jackcom/code-llama3-7Bi":
    case "@jackcom/striped-hyena-7B": {
      activeEmbedder = await JOpenAIEmbedder.getInstance(e);
      break;
    }
    case "huggingface": {
      activeEmbedder = await HFEmbedder.getInstance();
      break;
    }
    case "openai": {
      // requires user to provide their own API key
      if (!apiKey)
        return exportWorkerAlert("Please set your OpenAI API key!", "Error");
      activeEmbedder = await OpenAIEmbedder.getInstance(apiKey);
      break;
    }

    default: {
      let err = `${e} is an unsupported Embedding Model!`;
      err = `${err} Please select a different model in your "Assistant Settings."`;
      return exportWorkerAlert(err, "Error");
    }
  }

  return activeEmbedder;
}
