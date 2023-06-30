import { Author, Message } from './Message';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import React from 'react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { AgentData } from './ConversationAgent';

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
            <b>{!isAI ? '😀 You' : `${agent.emoji} ${agent.name}`}</b>
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
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {message.text}
      </ReactMarkdown>
    </div>
  );
}
