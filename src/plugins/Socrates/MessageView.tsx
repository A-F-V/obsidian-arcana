import { Author, Message } from './Message';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import React from 'react';

export default function MessageView({
  message,
  onCancel,
  onCopy,
}: {
  message: Message;
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
            <b>{!isAI ? '😀 You' : '🤖 Socrates'}</b>
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
      <ReactMarkdown>{message.text}</ReactMarkdown>
    </div>
  );
}
