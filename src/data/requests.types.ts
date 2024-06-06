export type SessionAction =
  | "get-user"
  | "oauth:complete"
  | "oauth:google"
  | "session:logout"
  | "session:refresh";

export type AssistantAction =
  | "assistant:generate-text"
  | "assistant:generate-image";

export type DataAction =
  | "documents:delete"
  | "documents:list"
  | "documents:upsert"
  | "share-user-document"
  | "user-projects:delete"
  | "user-projects:insert"
  | "user-projects:list"
  | "user-projects:reset"
  | "user-projects:share"
  | "user-projects:update"
  | "vector-search";
