import * as React from 'react';
import { MarkdownEditView, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import { useArcana } from 'src/hooks/hooks';
import { ConversationDialogue } from './ConversationDialogue';
import ArcanaPlugin from 'src/main';
import { Provider } from 'react-redux';
import store, { ChatAgentAction, ChatAgentState } from './AgentState';
import { useSelector, useDispatch } from 'react-redux';
import { AgentData, AgentDataLoader } from './ConversationAgent';
import AgentSelector from './AgentSelector';
import { getBaseName } from 'src/include/TextPostProcesssing';
import { AIFeedRegistery } from 'src/AIFeed';

function SocratesInnerView() {
  const [currentAgent, setCurrentAgent] = React.useState<string | null>(null);
  const [currentFile, setCurrentFile] = React.useState<TFile | null>(null);
  const arcana = useArcana();

  const setCurrentFileFromLeaf = () => {
    setCurrentFile(arcana.app.workspace.getActiveFile());
  };

  // Handles the current file changing
  React.useEffect(() => {
    // Activate
    arcana.registerEvent(
      arcana.app.workspace.on('active-leaf-change', setCurrentFileFromLeaf)
    );
    return () => {
      // Deactivate
      arcana.app.workspace.off('active-leaf-change', setCurrentFileFromLeaf);
    };
  }, []);

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
      <AgentSelector setCurrentAgent={setCurrentAgent} />
      {currentAgent ? (
        <>
          <h1>{currentAgent}</h1>
          <ConversationDialogue
            agentName={currentAgent}
            current_file={currentFile}
          />
        </>
      ) : (
        <h1>No Agent Selected</h1>
      )}
    </div>
  );
}

// A react component for the view
export const SocratesView = (
  arcana: ArcanaPlugin,
  getAgentFolder: () => string,
  getSocrates: () => AgentData
) => {
  // arcana.registerEvent(
  //   arcana.app.vault.on('create', (file: TFile) => {
  //     console.log('a new file has entered the arena');
  //   })
  // );
  //// Activate

  // Set periodic timer to update system message
  //React.useEffect(() => {
  //  const interval = setInterval(() => {
  //    const sys = '';
  //    if (sys != systemMessage) {
  //      setSystemMessage(sys);
  //    }
  //  }, 1000);
  //  return () => clearInterval(interval);
  //}, [systemMessage]);
  // Only register events once
  // TODO: Refactor these listeners out
  const isAgentFile = (file: TFile) => {
    return file.extension == 'md' && file.parent?.path == getAgentFolder();
  };

  const createAgent = (file: TFile) => {
    if (isAgentFile(file)) {
      AgentDataLoader.fromFile(arcana, file).then(
        (agentData: AgentData | null) => {
          if (agentData != null) {
            AIFeedRegistery.createFeedIfDoesNotExist(arcana, agentData.name);

            store.dispatch({
              type: 'agent/add',
              agent: agentData,
            });
          }
        }
      );
    }
  };

  const onModify = (file: TFile) => {
    if (isAgentFile(file)) {
      AgentDataLoader.fromFile(arcana, file).then(
        (agentData: AgentData | null) => {
          if (agentData != null) {
            AIFeedRegistery.createFeedIfDoesNotExist(arcana, agentData.name);

            store.dispatch({
              type: 'agent/update',
              agent: agentData,
              old_name: getBaseName(file.basename),
            });
          } else
            store.dispatch({
              type: 'agent/remove',
              name: getBaseName(file.basename),
            });
        }
      );
    }
  };

  const onDelete = (file: TFile) => {
    if (isAgentFile(file)) {
      store.dispatch({ type: 'agent/remove', name: file.basename });
    }
  };

  const onRename = (file: TFile, oldPath: string) => {
    if (isAgentFile(file)) {
      AgentDataLoader.fromFile(arcana, file).then(
        (agentData: AgentData | null) => {
          if (agentData != null) {
            AIFeedRegistery.createFeedIfDoesNotExist(arcana, agentData.name);
            store.dispatch({
              type: 'agent/update',
              agent: agentData,
              old_name: getBaseName(oldPath),
            });
          } else
            store.dispatch({
              type: 'agent/remove',
              name: getBaseName(oldPath),
            });
        }
      );
    }
  };

  const addAllAgentsInFolder = () => {
    const folder = arcana.app.vault.getAbstractFileByPath(getAgentFolder());
    if (folder instanceof TFolder) {
      folder.children.forEach(createAgent);
    }
  };
  const addSocrates = () => {
    const socrates = getSocrates();
    AIFeedRegistery.createFeedIfDoesNotExist(arcana, 'Socrates');
    store.dispatch({
      type: 'agent/add',
      agent: socrates,
    });
  };
  const updateSocrates = () => {
    const socrates = getSocrates();

    store.dispatch({
      type: 'agent/update',
      agent: socrates,
      old_name: 'Socrates',
    });
  };

  React.useEffect(() => {
    addSocrates();
    addAllAgentsInFolder();

    arcana.registerEvent(arcana.app.vault.on('create', createAgent));
    arcana.registerEvent(arcana.app.vault.on('modify', onModify));
    arcana.registerEvent(arcana.app.vault.on('delete', onDelete));
    arcana.registerEvent(arcana.app.vault.on('rename', onRename));
    const interval = window.setInterval(updateSocrates, 10000);
    arcana.registerInterval(interval);

    return () => {
      arcana.app.vault.off('create', createAgent);
      arcana.app.vault.off('modify', onModify);
      arcana.app.vault.off('delete', onDelete);
      arcana.app.vault.off('rename', onRename);
      window.clearInterval(interval);
    };
  }, []);
  return (
    <Provider store={store}>
      <SocratesInnerView />
    </Provider>
  );
};
//<h1>Socrates 🔮</h1>
//<ConversationDialogue current_file={file} systemMessage={systemMessage} />
