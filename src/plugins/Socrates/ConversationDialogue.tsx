import { MarkdownView, Notice, TFile } from 'obsidian';
import MessageView from './MessageView';
import React from 'react';
import { useArcana } from 'src/hooks/hooks';
import { removeFrontMatter } from 'src/utilities/DocumentCleaner';
import { useDispatch, useSelector } from 'react-redux';
import { ChatActionTypes, ChatAgentState, StoreDispatch } from './AgentState';
import AIFeed, { AIFeedRegistery } from 'src/AIFeed';
import {
  RecordingError,
  TranslationError,
  WhisperButton,
} from '../../components/MicrophoneButton';

export function ConversationDialogue({
  current_file,
  agentName,
}: {
  current_file: TFile | null;
  agentName: string;
}) {
  const arcana = useArcana();
  const { agent, messages } = useSelector(
    (state: ChatAgentState) => state.agents[agentName]
  );
  const [aiFeed, setAIFeed] = React.useState<AIFeed | null>(null);
  const userAreaRef = React.useRef<HTMLTextAreaElement>(null);
  const dispatch = useDispatch<StoreDispatch>();

  React.useEffect(() => {
    new Notice(`Agent ${agentName} selected`);
    // Load the AI Feed

    const aiFeed = AIFeedRegistery.getFeed(agentName);
    if (!aiFeed) {
      new Notice(`No AI Feed for ${agentName}`);
      return;
    }
    setAIFeed(aiFeed);
  }, [agentName]);

  // Sets the initial message whenever it changes
  React.useEffect(() => {
    console.log('Agent changed to ' + agentName);
    if (aiFeed) {
      aiFeed.setContext(agent.initialMessage);
    }
  }, [agentName]);

  const resetConversation = () => {
    dispatch({
      type: ChatActionTypes.RESET_AGENT_CONVERSATION,
      agentName,
    });

    aiFeed?.disconnect();
  };
  const cancelAIMessage = () => {
    aiFeed?.abortCurrentQuestion();
  };
  const createAIMessage = () => {
    dispatch({
      type: ChatActionTypes.CREATE_AI_MESSAGE,
      agentName,
    });
  };
  const addToAIMessage = (text: string) => {
    dispatch({
      type: ChatActionTypes.APPEND_TO_LAST_AI_MESSAGE,
      agentName,
      text,
    });
  };

  const askQuestion = (question: string) => {
    if (aiFeed) {
      createAIMessage();
      aiFeed.askQuestion(question, addToAIMessage);
    }
  };

  const createUserMessage = (message: string) => {
    dispatch({
      type: ChatActionTypes.CREATE_USER_MESSAGE,
      agentName,
      text: message,
    });
  };

  const sendMessage = React.useCallback(
    (textArea: HTMLTextAreaElement) => {
      if (aiFeed && !aiFeed.isQuestionBeingAsked()) {
        const question = textArea.value;
        textArea.value = '';
        createUserMessage(question);
        askQuestion(question);
      }
    },
    [agentName, aiFeed]
  );

  const onSubmitMessage = (e: any) => {
    if (e.key === 'Enter') sendMessage(e.currentTarget);
  };

  const sendFileMessage = () => {
    if (aiFeed) {
      // Load the current_file
      if (!current_file) {
        new Notice('No file selected');
        return;
      }

      arcana.app.vault.read(current_file).then(fileContents => {
        const message = `Below is a document the user wants you to read. Once you have read, reply with "All read 👍." .\nTitle:${
          current_file.basename
        }\n${removeFrontMatter(fileContents)}`;
        createUserMessage("I'm sending you a document to read");
        askQuestion(message);
      });
    }
  };

  const onTranscription = React.useCallback(
    (text: string) => {
      // Check if the user text area is valid, then append to it
      if (!userAreaRef.current) return;
      if (userAreaRef.current) {
        userAreaRef.current.value += text;
      }
      // If the agent is on auto send, then send the message

      if (agent.autoSendTranscription) sendMessage(userAreaRef.current);
    },
    [agentName, agent, sendMessage, userAreaRef]
  );

  return (
    <div className="conversation">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button className="beautiful-button" onClick={() => sendFileMessage()}>
          Send Note
        </button>
        <button
          className="beautiful-button"
          onClick={() => resetConversation()}
        >
          Reset
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div className="dialogue">
          {messages.map((message, i) => (
            <div key={i}>
              <MessageView
                message={message}
                agent={agent}
                onCancel={cancelAIMessage}
                onCopy={() => {
                  // TODO: Clean up
                  // Write the message to the current_file
                  // Get the editor for the active current_file
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
        <div
          style={{
            marginTop: '1em',
            padding: '2px',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          <textarea
            ref={userAreaRef}
            placeholder="Ask me something"
            onKeyUp={onSubmitMessage}
            className="beautiful-input"
            // So that we can add text to the textarea
          />
          <div style={{ margin: '2px' }}>
            <WhisperButton
              onTranscription={onTranscription}
              onFailedTranscription={(
                error: TranslationError | RecordingError
              ) => {
                console.log(error);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return <div></div>;
}
