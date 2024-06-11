import { useEffect, useMemo, useRef, useState } from "react";
import { askAssistant } from "chains";
import { ChatStore, JChatMessage } from "state/chat-store";
import { useMboxStore } from "hooks/useMboxStore";
import useUser from "hooks/useUser";
import useSettings from "hooks/useSettings";
import InputGroup from "./InputGroup";
import Markdown from "react-markdown";
import {
  sendFilesToParser,
  addTextToProjectContext,
  splitFileIntoSegments
} from "mbox/Mbox";
import { copyToClipboard } from "utils/general";
import "./ChatModule.scss";

const ERROR_MSG = {
  from: "Application",
  text: "[Error generating response]",
  incoming: true
};

enum STREAM {
  IDLE,
  START,
  ACTIVE
}

enum FILE_ACTION {
  NONE,
  PARSE,
  SPLIT
}

/** Chat message list and input */
const ChatModule = () => {
  const $fileInputRef = useRef<HTMLInputElement>(null);
  const $messageView = useRef<HTMLDivElement>(null);
  const { owner, colorIdent, enableCloudStorage } = useSettings([
    "owner",
    "colorIdent",
    "enableCloudStorage"
  ]);
  const { criticalError } = useUser(["criticalError"]);
  const [streamResponse, setStreamResponse] = useState("");
  const [state, setState] = useState(ChatStore.getState());
  const [fileAction, setFileAction] = useState(FILE_ACTION.PARSE);
  const [streamState, setStreamState] = useState(STREAM.IDLE);
  const { question, messages, loading } = useMemo(
    () => state,
    [state.loading, state.messages, state.question]
  );
  const { messagesLoaded, vectorStoreLoaded } = useMboxStore([
    "messagesLoaded",
    "vectorStoreLoaded"
  ]);
  const emptyMessage = useMemo(() => {
    if (criticalError) return "⚠️ Jackdaw Server is offline";
    if (loading) return "Please wait...";
    if (!vectorStoreLoaded) return "Load file or select Project";
    if (!messages.length) return "Ask a question";
    return "";
  }, [vectorStoreLoaded]);
  const placeholder = useMemo(() => {
    return messagesLoaded ? "Ask a question" : "( No document loaded )";
  }, [messagesLoaded]);
  const showFilePicker = (action = FILE_ACTION.PARSE) => {
    setFileAction(action);
    if ($fileInputRef.current) $fileInputRef.current.click();
  };
  const scrollMessagesView = () => {
    const $view = $messageView.current;
    if (!$view) return;
    $view.scrollTop = $view.scrollHeight;
  };
  const updateAndScroll = (messages: JChatMessage[]) => {
    setStreamState(STREAM.IDLE);
    setStreamResponse("");
    ChatStore.multiple({ messages, question: "", loading: false });
    scrollMessagesView();
  };
  /** Send question to API; update messages list */
  const handleFileSelection = (file?: File | null) => {
    switch (fileAction) {
      case FILE_ACTION.PARSE: {
        sendFilesToParser(file);
        break;
      }
      case FILE_ACTION.SPLIT: {
        splitFileIntoSegments(file);
        break;
      }
      default:
        break;
    }

    setFileAction(FILE_ACTION.NONE);
  };
  /** Send question to API; update messages list */
  const askQuestion = async (q?: string) => {
    const query = q || question;
    if (!query || loading) return;
    const next = [...messages, { from: owner, text: query }];
    ChatStore.multiple({ loading: true, messages: next });
    setStreamState(STREAM.START);
    setStreamResponse("( Thinking... )");
    scrollMessagesView();

    try {
      const res = await askAssistant(query);
      let text = "";
      const chunks: string[] = [];
      setStreamState(STREAM.ACTIVE);
      for await (const chunk of res) {
        chunks.push(chunk);
        text = chunks.join("");
        setStreamResponse(text);
        scrollMessagesView();
      }

      next.push(text ? { from: "Assistant", text, incoming: true } : ERROR_MSG);
      // return updateAndScroll(next);
    } catch (error) {
      console.log("Error generating response::", error);
      next.push(ERROR_MSG);
    } finally {
      updateAndScroll(next);
    }
  };

  useEffect(() => {
    if ($messageView.current) scrollMessagesView();
    const onState = () => setState(ChatStore.getState());
    return ChatStore.subscribe(onState);
  }, []);

  return (
    <section className="module--chat-messages">
      {/* Messages */}
      <div
        id="message-view"
        ref={$messageView}
        className="module--chat-messages__list-container"
        data-loaded={vectorStoreLoaded}
        data-error={criticalError}
        data-empty={!messages.length}
        data-empty-message={emptyMessage}
      >
        <div className="list--chat-messages">
          {messages.map(({ incoming, text, from }, i) => (
            <div
              key={i}
              className={`message ${incoming ? "assistant" : "user"}`}
            >
              <div className={`message--${incoming ? "incoming" : "outgoing"}`}>
                <div className="message__text">
                  <b
                    className={`message__source ${from}`}
                    style={incoming ? undefined : { color: colorIdent }}
                  >
                    {from}
                  </b>

                  <Markdown>{text}</Markdown>
                </div>
                {incoming && (
                  <span className="grid add-to-context">
                    <button
                      className="material-symbols-outlined"
                      data-tooltip="Save to Project"
                      disabled={!enableCloudStorage}
                      onClick={() => addTextToProjectContext(text)}
                    >
                      upload
                    </button>

                    <button
                      className="material-symbols-outlined"
                      data-tooltip="Copy response"
                      onClick={() => copyToClipboard(text)}
                    >
                      content_copy
                    </button>
                  </span>
                )}
              </div>
            </div>
          ))}

          {streamState !== STREAM.IDLE && (
            // Streams the assistant's response until the message stream is complete
            <div className="message">
              <div className="message--incoming">
                <div className="message__text">
                  <b className="message__source pulse infinite spinner--after">
                    Assistant
                  </b>

                  <Markdown>{streamResponse}</Markdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User text input */}
      <InputGroup
        allowAttachments
        highlightAttachmentsCtrl={!messagesLoaded}
        placeholder={placeholder}
        onAddNewFile={() => showFilePicker(FILE_ACTION.PARSE)}
        onSplitFile={() => showFilePicker(FILE_ACTION.SPLIT)}
        onChange={ChatStore.question}
        disabled={streamState !== STREAM.IDLE}
        handleSubmit={askQuestion}
      />
      <input
        type="file"
        ref={$fileInputRef}
        onChange={({ currentTarget }) =>
          handleFileSelection(currentTarget.files?.item(0))
        }
        hidden
      />
    </section>
  );
};

export default ChatModule;
