import { executiveAssistantPrompts } from "./AssistantPrompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { getActiveChatLLM } from "./Models";
import { findRelevantVectors } from "mbox/Mbox.VectorStore";
import { SettingsStore } from "state/settings-store";

let loading = false;

export async function askAssistant(input: string) {
  if (!input || loading) return "";
  else loading = true;

  try {
    const { owner } = SettingsStore.getState();
    const [context, chain] = await Promise.all([
      // Search the vector database for snippets that match the user's query. This
      // will be passed along to the documents chain.
      findRelevantVectors(input),

      // Create a "Chain" that can ingest LangChain's `Document` objects for context.
      createStuffDocumentsChain({
        llm: getActiveChatLLM(),
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
