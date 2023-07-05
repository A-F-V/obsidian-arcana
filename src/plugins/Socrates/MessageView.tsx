import React from 'react';
import { Author, Message } from './Message';
import { AgentData } from './ConversationAgent';
import MarkdownViewer from 'src/components/MarkdownViewer';

export default function MessageView({
  message,
  agent,
  onCancel,
  onCopy,
}: {
  message: Message;
  agent: AgentData;
  onCancel: () => void;
  onCopy: () => void;
}) {
  const [isAI, setIsAI] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (message.author === Author.AI) {
      setIsAI(true);
    }
  }, [message]);
  return (
    <div className={!isAI ? 'chat-message-user' : 'chat-message-ai'}>
      <div style={{ fontSize: '1.25em' }}>
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1 }}>
            <b>
              {!isAI
                ? `${agent.userEmoji} You`
                : `${agent.agentEmoji} ${agent.name}`}
            </b>
          </div>
          {isAI && (
            <div>
              <button
                className="beautiful-button"
                style={{ marginInline: 10 }}
                onClick={e => onCancel()}
              >
                ❌
              </button>
              <button
                className="beautiful-button"
                style={{ marginInline: 10 }}
                onClick={e => onCopy()}
              >
                ✍️
              </button>
            </div>
          )}
        </div>
      </div>
      <MarkdownViewer markdown={message.text} />
    </div>
  );
}
