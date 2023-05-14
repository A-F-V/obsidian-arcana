import React from 'react';
import { Message, Author } from './Message';
import { TFile } from 'obsidian';
import AIConversation from 'src/Conversation';
import Aborter from 'src/include/Aborter';

// TODO: Is there a better way?
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

  const createUserMessage = React.useCallback(
    (conversation: Conversation, text: string) => {
      conversation?.createUserMessage(text);
      setConversations(new Map(conversations));
    },
    [conversations]
  );

  const createAIMessage = React.useCallback(
    (conversation: Conversation) => {
      conversation?.createAIMessage();
      setConversations(new Map(conversations));
    },
    [conversations]
  );

  const addToAIMessage = React.useCallback(
    (conversation: Conversation, addition: string) => {
      conversation?.addToAIMessage(addition);
      setConversations(new Map(conversations));
    },
    [conversations]
  );

  const resetConversation = React.useCallback(
    (conversation: Conversation) => {
      conversation.messages.clear();
      conversation.aiConv.disengage();
      setConversations(new Map(conversations));
    },
    [conversations]
  );

  const finishAIMessage = React.useCallback(
    (conversation: Conversation) => {
      conversation?.finishAIMessage();
      setConversations(new Map(conversations));
    },
    [conversations]
  );

  return {
    conversations,
    addConversation,
    createUserMessage,
    createAIMessage,
    addToAIMessage,
    resetConversation,
    finishAIMessage,
  };
}

// TODO: Can ID be ignored
export class Conversation {
  messages: Map<number, Message> = new Map();
  aiConv: AIConversation;
  private messageBeingWritten = false;
  private currentAIMessage: null | Message = null;
  private currentAborter: Aborter = new Aborter();

  public constructor(aiConv: AIConversation) {
    this.aiConv = aiConv;
  }

  public createUserMessage(text: string) {
    const id = this.messages.size;
    const message = new Message(Author.User);
    message.addText(text);
    this.messages.set(id, message);
  }

  public createAIMessage() {
    const id = this.messages.size;
    const message = new Message(Author.AI);
    this.messages.set(id, message);
    this.currentAIMessage = message;
    this.currentAborter = new Aborter();
    this.messageBeingWritten = true;
  }

  public getCurrentAborter(): Aborter {
    return this.currentAborter;
  }

  public isMessageBeingWrittenBack(): boolean {
    return this.messageBeingWritten && !this.currentAborter.isAborted();
  }

  public addToAIMessage(addition: string) {
    this.currentAIMessage?.addText(addition);
  }

  public finishAIMessage() {
    this.currentAIMessage = null;
    this.messageBeingWritten = false;
  }
}
