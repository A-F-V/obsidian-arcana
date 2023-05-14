import Message from './Message';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import React from 'react';

export default function MessageView({ message }: { message: Message }) {
  return (
    <div
      className={
        message.author == 'user' ? 'chat-message-user' : 'chat-message-ai'
      }
    >
      <div style={{ fontSize: '1.25em' }}>
        <b>{message.author == 'user' ? '😀 You' : '🤖 Socrates'}</b>
      </div>
      <ReactMarkdown>{message.text}</ReactMarkdown>
    </div>
  );
}
