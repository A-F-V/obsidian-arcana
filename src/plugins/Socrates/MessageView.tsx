import * as React from 'react';
import { Author, Message } from './Message';
import { AgentData } from './ConversationAgent';
import MarkdownViewer from 'src/components/MarkdownViewer';
import Button from '@/components/Button';

export default function MessageView({
  message,
  agent,
  onCancel,
  onCopy,
  onSpeak,
}: {
  message: Message;
  agent: AgentData;
  onCancel: () => void;
  onCopy: () => void;
  onSpeak: (text: string) => void;
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
            <b>{!isAI ? `${agent.userEmoji} You` : `${agent.agentEmoji} ${agent.name}`}</b>
          </div>
          {isAI && (
            <div style={{ gap: 10 }}>
              <Button onClick={e => onCancel()}>❌</Button>
              <Button onClick={e => onCopy()}>✍️</Button>
              <Button onClick={e => onSpeak(message.text)}>🗣️</Button>
            </div>
          )}
        </div>
      </div>
      <MarkdownViewer markdown={message.text} />
    </div>
  );
}
