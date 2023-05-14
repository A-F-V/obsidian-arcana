import { FileView, MarkdownView, TFile } from 'obsidian';
import { Conversation, useConversations } from './Conversation';
import MessageView from './MessageView';
import React from 'react';
import { useArcana } from 'src/hooks/hooks';
import Aborter from 'src/include/Aborter';

function ConversationDialogue({
  file,
  conversation,
  createUserMessage,
  createAIMessage,
  addToAIMessage,
  finishAIMessage,
  resetConversation,
}: {
  file: TFile;
  conversation: Conversation;
  createUserMessage: (conversation: Conversation, text: string) => void;
  createAIMessage: (conversation: Conversation, text: string) => void;
  addToAIMessage: (conversation: Conversation, text: string) => void;
  finishAIMessage: (conversation: Conversation) => void;
  resetConversation: (conversation: Conversation) => void;
}) {
  const dialogueRef = React.useRef<HTMLDivElement | null>(null);
  const arcana = useArcana();
  // TODO: Trigger when you addToMessage
  /*
  React.useEffect(() => {
    // Scroll to bottom
    if (dialogueRef.current) {
      dialogueRef.current.scrollTop = dialogueRef.current.scrollHeight;
    }
  }, [conversation]);
  */
  const askQuestion = async (question: string) => {
    createAIMessage(conversation, 'ai');
    const currentAborter = conversation.getCurrentAborter();
    let firstAborted = false;
    await conversation.aiConv
      .askQuestion(
        question,
        (token: string) => {
          if (currentAborter.isAborted()) {
            if (!firstAborted) {
              addToAIMessage(conversation, ' (message aborted) ');
            }
            firstAborted = true;
            return;
          }
          addToAIMessage(conversation, token);
        },
        currentAborter.isAborted
      )
      .finally(() => {
        finishAIMessage(conversation);
      });
  };
  const onSubmitMessage = async (e: any) => {
    if (e.key == 'Enter' && !conversation.isMessageBeingWrittenBack()) {
      const question = e.currentTarget.value;
      // 1) Add the question to the conversation
      createUserMessage(conversation, question);
      e.currentTarget.value = '';
      // 2) Ask the question to AI, streaming the response to the conversation
      await askQuestion(question);
    }
  };

  return (
    <div className="conversation">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2>{file.basename}</h2>
        <button
          className="beautiful-button"
          onClick={() => resetConversation(conversation)}
        >
          Reset
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div className="dialogue" ref={dialogueRef}>
          {Array.from(conversation.messages).map(([i, message]) => (
            <div key={i}>
              <MessageView
                message={message}
                onCancel={() => {
                  const aborter = conversation.getCurrentAborter();
                  aborter.abort();
                }}
                onCopy={() => {
                  // Write the message to the file
                  // Get the editor for the active file
                  const mdView = arcana.app.workspace.getMostRecentLeaf()
                    ?.view as MarkdownView;
                  if (mdView) {
                    // Get current selection
                    const selection = mdView.editor.getSelection();
                    if (selection.length > 0)
                      mdView.editor.replaceSelection(
                        selection + ' ' + message.text
                      );
                    else mdView.editor.replaceSelection(message.text);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <div style={{ marginTop: '1em' }}>
          <input
            type="text"
            placeholder="Ask me something"
            onKeyUp={onSubmitMessage}
            className="beautiful-input"
          />
        </div>
      </div>
    </div>
  );
}

export default function ConversationManager({
  file,
  systemMessage,
  onResetConversation,
}: {
  file: TFile | null;
  systemMessage: string | null;
  onResetConversation: () => void;
}) {
  const arcana = useArcana();
  const {
    conversations,
    addConversation,
    createAIMessage,
    createUserMessage,
    addToAIMessage,
    finishAIMessage,
    resetConversation,
  } = useConversations();

  const [currentConversation, setCurrentConversation] =
    React.useState<Conversation | null>(null);

  React.useEffect(() => {
    if (file) {
      if (
        (!conversations.has(file) || // If its a new file
          conversations.get(file)?.aiConv.getContext() !== systemMessage) && // Or the file contets have changed
        systemMessage !== null
      ) {
        const aiConv = arcana.startConversation(systemMessage);
        addConversation(file, aiConv);
      }
      setCurrentConversation(conversations.get(file) ?? null);
    } else {
      setCurrentConversation(null);
    }
  }, [file, conversations, systemMessage]);

  // Retrigger generation of system message when file changes
  const resetConversationAndGetNewSystemMessage = React.useCallback(
    (conversation: Conversation) => {
      resetConversation(conversation);
      onResetConversation();
    },
    [resetConversation, onResetConversation]
  );

  // Test
  React.useEffect(() => {}, [currentConversation]);

  return (
    <>
      {file && currentConversation && (
        <ConversationDialogue
          file={file}
          conversation={currentConversation}
          createUserMessage={createUserMessage}
          createAIMessage={createAIMessage}
          addToAIMessage={addToAIMessage}
          finishAIMessage={finishAIMessage}
          resetConversation={resetConversationAndGetNewSystemMessage}
        />
      )}
      {!file && (
        <div>
          <h2>Open a file to begin 😊</h2>
        </div>
      )}
      {file && !currentConversation && (
        <div>
          <h2>Starting conversation...</h2>
        </div>
      )}
    </>
  );
}
