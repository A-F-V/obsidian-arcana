import ArcanaPlugin from 'src/main';
import * as React from 'react';
import Conversation from 'src/Conversation';
import { TFile, WorkspaceLeaf } from 'obsidian';
import { ArcanaContext } from 'src/hooks/context';
import { useArcana } from 'src/hooks/hooks';

export const SOCRATES_VIEW_TYPE = 'socrates-view';

class Message {
  message = '';

  constructor(message: string) {
    this.message = message;
  }
  addToMessage(message: string) {
    this.message += message;
  }

  clearMessage() {
    this.message = '';
  }
}

class Dialogue {
  messages: Message[] = [];
  conversation: Conversation | null = null;

  setConversation(conversation: Conversation) {
    this.conversation = conversation;
  }

  addMessage(message: Message) {
    this.messages.push(message);
  }
}

function ConversationDialogue({
  conversationID,
}: {
  conversationID: number | null;
}) {
  const arcana = useArcana();
  const [dialogues, setDialogues] = React.useState<Map<number, Dialogue>>(
    new Map()
  );
  const [question, setQuestion] = React.useState<string>('');

  const [currentDialogue, setCurrentDialogue] = React.useState<Dialogue | null>(
    null
  );

  React.useEffect(() => {
    if (!conversationID) setCurrentDialogue(null);
    else {
      if (dialogues.has(conversationID)) {
        setCurrentDialogue(dialogues.get(conversationID)!);
      } else {
        setCurrentDialogue(new Dialogue());
        dialogues.set(conversationID, currentDialogue!);
        setDialogues(dialogues);
      }
    }
  }, [conversationID]);

  const addNewMessages = () => {
    if (currentDialogue) {
      // Add the message
      currentDialogue.addMessage(new Message(question));
      setCurrentDialogue(currentDialogue);
      if (currentDialogue.messages.length > 1) {
        const responseMessage = new Message('');
        currentDialogue.addMessage(responseMessage);

        currentDialogue.conversation!.askQuestion(question, (token: string) => {
          responseMessage.addToMessage(token);
          setCurrentDialogue(currentDialogue);
        });
      } else {
        const newConversation = arcana.startConversation(question);
        currentDialogue.setConversation(newConversation);
      }
    }
  };

  const onSubmitMessage = async (e: any) => {
    e.preventDefault();
    if (e.key == 'Enter') {
      setQuestion(e.currentTarget.value);
      e.currentTarget.value = '';

      addNewMessages();
    }
  };
  return (
    <div>
      {currentDialogue?.messages.map((message, index) => (
        <div key={index}>
          <p>{message.message}</p>
        </div>
      ))}
      <input type="text" onKeyUp={onSubmitMessage} />
    </div>
  );
}

// A react component for the view
export const SocratesView = () => {
  const arcana = useArcana();
  const [currentID, setCurrentID] = React.useState<number | null>(null);

  // when the current file changes, change conversation

  const setCurrentFile = async (leaf: WorkspaceLeaf) => {
    // Get the file from leaf
    const file = arcana.app.workspace.getActiveFile();
    if (file) {
      const fileID = await arcana!.getFileID(file);

      setCurrentID(fileID);
    }
  };
  // Activate
  arcana.app.workspace.on('active-leaf-change', setCurrentFile);
  // Deactivate
  arcana.registerResource(() =>
    arcana.app.workspace.off('active-leaf-change', setCurrentFile)
  );
  return (
    <div>
      <h1>Socrates</h1>
      <ConversationDialogue conversationID={currentID} />
    </div>
  );
};
