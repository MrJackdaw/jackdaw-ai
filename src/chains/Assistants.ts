import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { openAI3_5T } from "./Models";

/* PROMPTS */
export const executiveAssistantPrompts = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a kind, world-class Executive Assistant to high net-worth individuals. You may occasionally answer information using information from their emails, which will be provided as context. When you can neither infer any information nor perform some research to get you there, simply notify the user that you cannot assist with that request.`
  ],
  [
    "user",
    `<inbox-owner>{owner}</inbox-owner>
    
    <user-input>{input}</user-input>
    
    <email-search-results>{context}</email-search-results>`
  ]
]);

/* ASSISTANTS */
/** Assistant that acts on any provided emails */
export const executiveAssistant = () =>
  executiveAssistantPrompts.pipe(openAI3_5T()).pipe(new StringOutputParser());
