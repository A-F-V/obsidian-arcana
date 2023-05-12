import React from 'react';
import Message from './Message';
import { TFile } from 'obsidian';
import AIConversation from 'src/Conversation';

export function useConversations() {
  const [conversations, setConversations] = React.useState<
    Map<TFile, Conversation>
  >(new Map<TFile, Conversation>());

  const addConversation = React.useCallback(
    (file: TFile, aiConv: AIConversation) => {
      const conversation = new Conversation(aiConv);
      setConversations(new Map(conversations).set(file, conversation));
    },
    [conversations]
  );

  const createMessage = React.useCallback(
    (conversation: Conversation, author: string) => {
      const id = conversation?.createNewMessageBy(author);
      setConversations(new Map(conversations));
      return id;
    },
    [conversations]
  );

  const addToMessage = React.useCallback(
    (conversation: Conversation, id: number, addition: string) => {
      console.log(`Adding ${addition} to message ${id}`); // TODO: Remove this line
      conversation?.addToMessage(id, addition);
      setConversations(new Map(conversations));
    },
    [conversations]
  );

  return { conversations, addConversation, createMessage, addToMessage };
}

export class Conversation {
  messages: Map<number, Message> = new Map();
  aiConv: AIConversation;

  public constructor(aiConv: AIConversation) {
    this.aiConv = aiConv;
  }

  public createNewMessageBy(author: string): number {
    const id = this.messages.size;
    this.messages.set(id, new Message(author));
    return id;
  }

  public addToMessage(id: number, addition: string) {
    this.messages.get(id)?.addText(addition);
  }
}
