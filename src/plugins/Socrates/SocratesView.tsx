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
  return `You are a very intelligent thinker that is having a conversation with a human. The user has presented you with a file called ${title}. The file contains the following text:\n ${text}. The user will then start asking you questions that may be related to the text in the file. You should try to answer the questions as best as you can.`;
}

// A react component for the view
export const SocratesView = () => {
  const arcana = useArcana();
  const [file, setFile] = React.useState<TFile | null>(null);
  const [systemMessage, setSystemMessage] = React.useState<string | null>(null);

  const setCurrentFile = () => {
    const file = arcana.app.workspace.getActiveFile();
    if (file) {
      createSystemMessage(arcana, file).then(message => {
        setSystemMessage(message);
        setFile(file);
      });
    } else {
      setSystemMessage(null);
      setFile(null);
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
      <ConversationManager file={file} systemMessage={systemMessage} />
    </div>
  );
};
