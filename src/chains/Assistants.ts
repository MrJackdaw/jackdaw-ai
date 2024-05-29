import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { openAI3_5T } from "./Models";

/* PROMPTS */
export const executiveAssistantPrompts = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a kind, world-class Executive Assistant to high net-worth individuals. You will assist them with one or more user-provided text-based files (such as emails, PDFs, etc). When you cannot infer any information nor perform some research to get you there, and when no additional tools have been provided that enable completion of a task, simply notify the user that you cannot assist with that request.`
  ],
  [
    "user",
    `<inbox-owner>{owner}</inbox-owner>
    <user-input>{input}</user-input>
    <document-search-results>{context}</document-search-results>`
  ]
]);

/* ASSISTANTS */
/** Assistant that acts on any provided emails */
export const executiveAssistant = () =>
  executiveAssistantPrompts.pipe(openAI3_5T()).pipe(new StringOutputParser());
