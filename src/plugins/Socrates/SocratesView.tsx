import * as React from 'react';
import { TFile } from 'obsidian';
import { useArcana } from 'src/hooks/hooks';
import ConversationManager from './ConversationDialogue';
import ArcanaPlugin from 'src/main';
import { removeFrontMatter } from 'src/utilities/DocumentCleaner';

async function createSystemMessage(arcana: ArcanaPlugin, file: TFile) {
  let text = await arcana.app.vault.read(file);
  text = removeFrontMatter(text);
  const title = file.basename;
  return `You are a very intelligent thinker that is having a conversation with a human. The user has presented you with a file called ${title}. The file contains the following text:\n ${text}. The user will then start asking you questions that may be related to the text in the file, but also draw ideas from your own knowledge. You should try to answer the questions as best as you can.`;
}

// A react component for the view
export const SocratesView = () => {
  const arcana = useArcana();
  const [file, setFile] = React.useState<TFile | null>(null);
  const [systemMessage, setSystemMessage] = React.useState<string | null>(null);

  const setCurrentFile = () => {
    setFile(arcana.app.workspace.getActiveFile());
    setSystemMessage(null);
  };

  const fetchNewestSystemMessage = React.useCallback(() => {
    if (file) {
      createSystemMessage(arcana, file).then(message => {
        setSystemMessage(message);
      });
    } else {
      setSystemMessage(null);
    }
  }, [file]);

  React.useEffect(() => {
    fetchNewestSystemMessage();
  }, [file]);

  // Activate
  arcana.app.workspace.on('active-leaf-change', setCurrentFile);
  // Deactivate
  arcana.registerResource(() =>
    arcana.app.workspace.off('active-leaf-change', setCurrentFile)
  );
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <h1>Socrates 🔮</h1>
      <ConversationManager
        file={file}
        systemMessage={systemMessage}
        onResetConversation={fetchNewestSystemMessage}
      />
    </div>
  );
};
