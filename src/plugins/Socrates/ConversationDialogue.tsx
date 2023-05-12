import { TFile } from 'obsidian';
import { Conversation, useConversations } from './Conversation';
import Message from './Message';
import React from 'react';
import { useArcana } from 'src/hooks/hooks';

function MessageView({ message }: { message: Message }) {
  return message.author == 'user' ? (
    <div className="message" style={{ border: '3px solid #f00' }}>
      <h5>User</h5>
      <p>{message.text}</p>
    </div>
  ) : (
    <div className="message" style={{ border: '3px solid #00f' }}>
      <h5>AI</h5>
      <p>{message.text}</p>
    </div>
  );
}

function ConversationDialogue({
  file,
  conversation,
  createMessage,
  addToMessage,
}: {
  file: TFile;
  conversation: Conversation;
  createMessage: (conversation: Conversation, author: string) => number;
  addToMessage: (conversation: Conversation, id: number, text: string) => void;
}) {
  const [questionInFlight, setQuestionInFlight] = React.useState(false);

  const addQuestion = (question: string) => {
    const id = createMessage(conversation, 'user');
    addToMessage(conversation, id, question);
  };

  const askQuestion = async (question: string) => {
    setQuestionInFlight(true);
    const id = createMessage(conversation, 'ai');

    await conversation.aiConv.askQuestion(question, (token: string) => {
      addToMessage(conversation, id, token);
    });

    setQuestionInFlight(false);
  };

  const onSubmitMessage = async (e: any) => {
    if (e.key == 'Enter' && !questionInFlight) {
      const question = e.currentTarget.value;
      // 1) Add the question to the conversation
      addQuestion(question);
      e.currentTarget.value = '';
      // 2) Ask the question to AI, streaming the response to the conversation
      await askQuestion(question);
    }
  };

  // Reload when the conversation changes
  React.useEffect(() => {
    console.log('Conversation changed');
  }, [conversation]);
  return (
    <div>
      <h1>{file.basename}</h1>
      <div>
        {Array.from(conversation.messages).map(([i, message]) => (
          <div key={i}>
            <MessageView message={message} />
          </div>
        ))}
      </div>
      <input type="text" onKeyUp={onSubmitMessage} />
    </div>
  );
}

export default function ConversationManager({
  file,
  systemMessage,
}: {
  file: TFile | null;
  systemMessage: string | null;
}) {
  const arcana = useArcana();
  const { conversations, addConversation, createMessage, addToMessage } =
    useConversations();

  const [currentConversation, setCurrentConversation] =
    React.useState<Conversation | null>(null);

  React.useEffect(() => {
    if (file && systemMessage) {
      if (!conversations.has(file)) {
        const aiConv = arcana.startConversation(systemMessage);
        addConversation(file, aiConv);
      }
      setCurrentConversation(conversations.get(file) ?? null);
    } else {
      setCurrentConversation(null);
    }
  }, [file, conversations]);

  return (
    <div>
      {file && currentConversation && systemMessage && (
        <ConversationDialogue
          file={file}
          conversation={currentConversation}
          createMessage={createMessage}
          addToMessage={addToMessage}
        />
      )}
    </div>
  );
}
