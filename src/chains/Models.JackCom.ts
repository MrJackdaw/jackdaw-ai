import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { BaseLanguageModelParams } from "@langchain/core/language_models/base";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { ChatResult } from "@langchain/core/outputs";
import { assistantActionFetch } from "data/requests.shared";
import { updateAsError } from "state/notifications";

export type ChatJackCOMArgs = BaseLanguageModelParams & {
  model: "@jackcom/openai" | "@jackcom/togetherai";
};

/** Custom Chat LLM for proxying calls to OpenAI */
export default class ChatJackCOM extends BaseChatModel {
  private _llmTarget: "@jackcom/openai" | "@jackcom/togetherai";

  constructor(args: ChatJackCOMArgs) {
    super(args);
    this._llmTarget = args.model ?? "@jackcom/openai";
  }

  async _call(
    messages: BaseMessage[],
    _options: this["ParsedCallOptions"],
    _runManager?: CallbackManagerForLLMRun
  ): Promise<string> {
    if (!messages.length) {
      throw new Error("No messages provided.");
    }
    // Pass `runManager?.getChild()` when invoking internal runnables to enable tracing
    // await subRunnable.invoke(params, runManager?.getChild());
    if (typeof messages[0].content !== "string") {
      throw new Error("Multimodal messages are not yet supported.");
    }
    return messages[0].content;
  }

  _llmType(): string {
    return this._llmTarget;
  }

  async _generate(
    messages: BaseMessage[],
    options: this["ParsedCallOptions"],
    _runManager?: CallbackManagerForLLMRun | undefined
  ): Promise<ChatResult> {
    // Create the payload to send to your server
    const payload = {
      messages: messages.map((m) => [m._getType(), m.content]),
      options
    };

    try {
      // Make the HTTP request to your server
      const response = await assistantActionFetch(
        "assistant:generate-text",
        payload
      );
      const text = response.data?.kwargs?.content;
      return {
        generations: [{ message: new AIMessage({ content: text }), text }],
        llmOutput: {}
      };
    } catch (error) {
      // Log any errors encountered during the process
      updateAsError("Error generating respnse:" + error);
      throw new Error("Failed to generate chat result from server");
    }
  }
}
