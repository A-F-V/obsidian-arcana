import * as React from 'react';
import { TFile, TFolder } from 'obsidian';
import { useArcana } from 'src/hooks/hooks';
import { ConversationDialogue } from './ConversationDialogue';
import { Provider } from 'react-redux';
import store from './AgentState';
import { AgentData, AgentDataLoader } from './ConversationAgent';
import AgentSelector from './AgentSelector';
import { getBaseName } from 'src/include/TextPostProcesssing';
import { AIFeedRegistery } from 'src/AIFeed';
import { MicrophoneContext } from 'src/hooks/context';

function SocratesInnerView() {
  const [currentAgent, setCurrentAgent] = React.useState<string | null>(null);
  const [currentFile, setCurrentFile] = React.useState<TFile | null>(null);
  const microphoneContext = React.useContext(MicrophoneContext);
  const dialogueRef = React.useRef(null);

  const { app, plugin } = useArcana();

  const setCurrentFileFromLeaf = () => {
    setCurrentFile(app.workspace.getActiveFile());
  };

  // Handles the current file changing
  React.useEffect(() => {
    // Activate
    plugin.registerEvent(app.workspace.on('active-leaf-change', setCurrentFileFromLeaf));
    return () => {
      // Deactivate
      app.workspace.off('active-leaf-change', setCurrentFileFromLeaf);
    };
  }, []);

  // Whenever the dialogue changes, set the toggle microphone
  React.useEffect(() => {
    if (dialogueRef.current) {
      microphoneContext.toggleMicrophone = () => {
        // @ts-ignore
        dialogueRef.current?.toggleMicrophone();
      };
    } else {
      microphoneContext.toggleMicrophone = () => {};
    }
  }, [currentAgent]);

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
          <ConversationDialogue ref={dialogueRef} agentName={currentAgent} current_file={currentFile} />
        </>
      ) : (
        <h1>No Agent Selected</h1>
      )}
    </div>
  );
}

// A react component for the view
export const SocratesView = (getAgentFolder: () => string, getSocrates: () => AgentData) => {
  const { app, agent, plugin } = useArcana();

  const isAgentFile = (file: TFile) => {
    return file.extension == 'md' && file.parent?.path == getAgentFolder();
  };

  const createAgent = (file: TFile) => {
    if (isAgentFile(file)) {
      AgentDataLoader.fromFile(app, file).then((agentData: AgentData | null) => {
        if (agentData != null) {
          AIFeedRegistery.createFeedIfDoesNotExist(agent, agentData.name);

          store.dispatch({
            type: 'agent/add',
            agent: agentData,
          });
        }
      });
    }
  };

  const onModify = (file: TFile) => {
    if (isAgentFile(file)) {
      AgentDataLoader.fromFile(app, file).then((agentData: AgentData | null) => {
        if (agentData != null) {
          AIFeedRegistery.createFeedIfDoesNotExist(agent, agentData.name);

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
      });
    }
  };

  const onDelete = (file: TFile) => {
    if (isAgentFile(file)) {
      store.dispatch({ type: 'agent/remove', name: file.basename });
    }
  };

  const onRename = (file: TFile, oldPath: string) => {
    if (isAgentFile(file)) {
      AgentDataLoader.fromFile(app, file).then((agentData: AgentData | null) => {
        if (agentData != null) {
          AIFeedRegistery.createFeedIfDoesNotExist(agent, agentData.name);
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
      });
    }
  };

  const addAllAgentsInFolder = () => {
    const folder = app.vault.getAbstractFileByPath(getAgentFolder());
    if (folder instanceof TFolder) {
      folder.children.forEach(createAgent);
    }
  };
  const addSocrates = () => {
    const socrates = getSocrates();
    AIFeedRegistery.createFeedIfDoesNotExist(agent, 'Socrates');
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

    plugin.registerEvent(app.vault.on('create', createAgent));
    plugin.registerEvent(app.vault.on('modify', onModify));
    plugin.registerEvent(app.vault.on('delete', onDelete));
    plugin.registerEvent(app.vault.on('rename', onRename));
    const interval = window.setInterval(updateSocrates, 10000);
    plugin.registerInterval(interval);

    return () => {
      app.vault.off('create', createAgent);
      app.vault.off('modify', onModify);
      app.vault.off('delete', onDelete);
      app.vault.off('rename', onRename);
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
