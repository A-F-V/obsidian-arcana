import * as React from 'react';
import { TFile } from 'obsidian';
import { useArcana } from 'src/hooks/hooks';
import { ConversationDialogue } from './ConversationDialogue';

// A react component for the view
export const SocratesView = (getSystemMessage: () => string) => {
  const arcana = useArcana();
  const [file, setFile] = React.useState<TFile | null>(null);
  const [systemMessage, setSystemMessage] = React.useState<string>(
    getSystemMessage()
  );

  const setCurrentFile = () => {
    setFile(arcana.app.workspace.getActiveFile());
  };

  // Activate
  arcana.app.workspace.on('active-leaf-change', setCurrentFile);
  // Deactivate
  arcana.registerResource(() =>
    arcana.app.workspace.off('active-leaf-change', setCurrentFile)
  );

  // Set periodic timer to update system message
  React.useEffect(() => {
    const interval = setInterval(() => {
      const sys = getSystemMessage();
      if (sys != systemMessage) {
        setSystemMessage(sys);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [systemMessage]);

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
      <ConversationDialogue file={file} systemMessage={systemMessage} />
    </div>
  );
};
