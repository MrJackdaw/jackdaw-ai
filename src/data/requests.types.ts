export type SessionAction =
  | "get-user"
  | "oauth:complete"
  | "oauth:google"
  | "session:logout"
  | "session:refresh";

export type DataAction =
  | "documents:upsert"
  | "documents:delete"
  | "documents:list"
  | "share-user-document"
  | "user-projects:insert"
  | "user-projects:update"
  | "user-projects:delete"
  | "user-projects:list"
  | "user-projects:share"
  | "vector-search";
