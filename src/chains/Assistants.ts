import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { openAI3_5T } from "./Models";

/* PROMPTS */
export const executiveAssistantPrompts = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a world-class Virtual Executive Assistant serving high net-worth individuals with kindness and efficiency.

    When handling requests, you may receive additional context from relevant documents, marked by a <primary-context> tag. Use this information along with any other tools at your disposal to provide a comprehensive response to the user's query. Rely on your own knowledge and tools when the tag is missing or empty. 
    
    If you are unable to assist with a request and no additional tools are available to complete the task, inform the user that you cannot assist.`
  ],
  [
    "user",
    `<owner>{owner}</owner>
    <user-input>{input}</user-input>
    <primary-context>{context}</primary-context>`
  ]
]);

/* ASSISTANTS */
/** Assistant that acts on any provided emails */
export const executiveAssistant = () =>
  executiveAssistantPrompts.pipe(openAI3_5T()).pipe(new StringOutputParser());
