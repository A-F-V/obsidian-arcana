import { TFile } from 'obsidian';
import { Conversation, useConversations } from './Conversation';
import Message from './Message';
import React from 'react';
import { useArcana } from 'src/hooks/hooks';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';

function MessageView({ message }: { message: Message }) {
  return message.author == 'user' ? (
    <div className="chat-message" style={{ border: '2px solid ' }}>
      <h5 style={{ margin: 0 }}>You</h5>
      <ReactMarkdown>{message.text}</ReactMarkdown>
    </div>
  ) : (
    <div
      className="chat-message"
      style={{ border: '2px solid rgba(0, 123, 255, 0.25)' }}
    >
      <h5 style={{ margin: 0 }}>Socrates</h5>
      <ReactMarkdown>{message.text}</ReactMarkdown>
    </div>
  );
}

function ConversationDialogue({
  file,
  conversation,
  createMessage,
  addToMessage,
  resetConversation,
}: {
  file: TFile;
  conversation: Conversation;
  createMessage: (conversation: Conversation, author: string) => number;
  addToMessage: (conversation: Conversation, id: number, text: string) => void;
  resetConversation: (conversation: Conversation) => void;
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

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2>{file.basename}</h2>
        <button onClick={() => resetConversation(conversation)}>Reset</button>
      </div>
      <input
        type="text"
        placeholder="Ask me something"
        onKeyUp={onSubmitMessage}
        className="beautiful-input"
      />
      <div className="dialogue">
        {Array.from(conversation.messages).map(([i, message]) => (
          <div key={i}>
            <MessageView message={message} />
          </div>
        ))}
      </div>
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
  const {
    conversations,
    addConversation,
    createMessage,
    addToMessage,
    resetConversation,
  } = useConversations();

  const [currentConversation, setCurrentConversation] =
    React.useState<Conversation | null>(null);

  React.useEffect(() => {
    if (file) {
      if (!conversations.has(file) && systemMessage) {
        const aiConv = arcana.startConversation(systemMessage);
        addConversation(file, aiConv);
      }
      setCurrentConversation(conversations.get(file) ?? null);
    } else {
      setCurrentConversation(null);
    }
  }, [file, conversations, systemMessage]);

  return (
    <div>
      {file && currentConversation && (
        <ConversationDialogue
          file={file}
          conversation={currentConversation}
          createMessage={createMessage}
          addToMessage={addToMessage}
          resetConversation={resetConversation}
        />
      )}
      {!file && (
        <div>
          <h2>Open a file to begin 😊</h2>
        </div>
      )}
      {file && !currentConversation && (
        <div>
          <h2>Starting conversation...</h2>
        </div>
      )}
    </div>
  );
}
