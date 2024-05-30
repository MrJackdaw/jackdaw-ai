import createState from "@jackcom/raphsducks";

export type JChatMessage = {
  from: string;
  text: string;
  incoming?: boolean;
};

/** IN-memory store that holds chat messages */
export const ChatStore = createState({
  messages: [] as JChatMessage[],
  question: "",
  loading: false
});
