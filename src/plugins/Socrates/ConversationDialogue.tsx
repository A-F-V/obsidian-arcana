import { MarkdownView, Notice, TFile } from 'obsidian';
import MessageView from './MessageView';
import React from 'react';
import { useArcana } from 'src/hooks/hooks';
import { removeFrontMatter } from 'src/utilities/DocumentCleaner';
import { useDispatch, useSelector } from 'react-redux';
import { ChatActionTypes, ChatAgentState, StoreDispatch } from './AgentState';
import AIFeed, { AIFeedRegistery } from 'src/AIFeed';
import { Message } from './Message';

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
    if (aiFeed) {
      aiFeed.setContext(agent.initialMessage);
    }
  }, [aiFeed, agent.initialMessage]);

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

  const onSubmitMessage = (e: any) => {
    if (e.key == 'Enter' && aiFeed && !aiFeed.isQuestionBeingAsked()) {
      const question = e.currentTarget.value;
      e.currentTarget.value = '';
      createUserMessage(question);
      askQuestion(question);
    }
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

  return <div></div>;
}
