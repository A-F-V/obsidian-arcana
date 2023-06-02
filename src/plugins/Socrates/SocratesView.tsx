import * as React from 'react';
import { TFile } from 'obsidian';
import { useArcana } from 'src/hooks/hooks';
import ConversationManager from './ConversationDialogue';

// A react component for the view
export const SocratesView = (
  createSystemMessage: (file: TFile) => Promise<string>
) => {
  const arcana = useArcana();
  const [file, setFile] = React.useState<TFile | null>(null);

  const setCurrentFile = () => {
    setFile(arcana.app.workspace.getActiveFile());
  };

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
        userSelect: 'text',
      }}
    >
      <h1>Socrates 🔮</h1>
      <ConversationManager file={file} getSystemMessage={createSystemMessage} />
    </div>
  );
};
