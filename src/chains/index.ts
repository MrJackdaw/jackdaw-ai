import { executiveAssistantPrompts } from "./Assistants";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { AssistantInvokeParams, getActiveLLM } from "./Models";
import { findRelevantVectors } from "mbox/Mbox.VectorStore";
import { LS_ASSISTANT_KEY } from "utils/strings";
import { RunnableLambda } from "@langchain/core/runnables";
import { SettingsStore } from "state/settings-store";
import { pipeline } from "@xenova/transformers";

let loading = false;

export async function askAssistant(input: string) {
  if (!input || loading) return "";
  else loading = true;

  try {
    // const llm = openAI4o();
    const { owner } = SettingsStore.getState();
    const [context, chain] = await Promise.all([
      // Search the vector database for snippets that match the user's query. This
      // will be passed along to the documents chain.
      findRelevantVectors(input),

      // Create a "Chain" that can ingest LangChain's `Document` objects for context.
      localStorage.getItem(LS_ASSISTANT_KEY) === "huggingface"
        ? // Cheating: allow user to query in-memory vector store when offline
          huggingfaceChain()
        : // Create a standard chain
          createStuffDocumentsChain({
            llm: getActiveLLM(),
            prompt: executiveAssistantPrompts,
            outputParser: new StringOutputParser()
          })
    ]);

    loading = false;
    const invokeParams = { input, context, owner };
    const stream = await chain.stream(invokeParams);
    return stream;
  } catch (error) {
    loading = false;
    return "";
  }
}

/** Allow user to query their vector embeddings when offline or just using hf */
function huggingfaceChain() {
  const wrappedSearch = async ({ context, input }: AssistantInvokeParams) => {
    const contextStr = context.map((c) => c.pageContent).join("\n\n");
    return pipeline("question-answering", "iagovar/roberta-base-bne-sqac-onnx")
      .then((ask) => ask(input, contextStr))
      .then((res) => (Array.isArray(res) ? res[0] : res).answer);
  };

  return RunnableLambda.from(wrappedSearch);
}
