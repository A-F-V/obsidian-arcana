import * as React from 'react';
import { TFile, TFolder } from 'obsidian';
import { useArcana } from 'src/hooks/hooks';
import { ConversationDialogue } from './ConversationDialogue';
import ArcanaPlugin from 'src/main';
import { Provider } from 'react-redux';
import store, { ChatAgentAction, ChatAgentState } from './AgentState';
import { useSelector, useDispatch } from 'react-redux';
import { AgentData, AgentDataLoader } from './ConversationAgent';
import AgentSelector from './AgentSelector';
import { getBaseName } from 'src/include/TextPostProcesssing';

function SocratesInnerView() {
  const [currentAgent, setCurrentAgent] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (currentAgent) {
      console.log(`Current agent is ${currentAgent}`);
    }
  }, [currentAgent]);

  return (
    <div>
      <AgentSelector setCurrentAgent={setCurrentAgent} />
    </div>
  );
}

// A react component for the view
export const SocratesView = (
  arcana: ArcanaPlugin,
  getAgentFolder: () => string
) => {
  // arcana.registerEvent(
  //   arcana.app.vault.on('create', (file: TFile) => {
  //     console.log('a new file has entered the arena');
  //   })
  // );
  //// Activate
  //arcana.app.workspace.on('active-leaf-change', setCurrentFile);
  //// Deactivate
  //arcana.registerResource(() =>
  //  arcana.app.workspace.off('active-leaf-change', setCurrentFile)
  //);

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
      AgentDataLoader.fromFile(arcana, file).then((agentData: AgentData) => {
        store.dispatch({
          type: 'agent/add',
          agent: agentData,
          chat_id: 1,
        });
      });
    }
  };

  const onModify = (file: TFile) => {
    if (isAgentFile(file)) {
      AgentDataLoader.fromFile(arcana, file).then((agentData: AgentData) => {
        store.dispatch({
          type: 'agent/update',
          agent: agentData,
          old_name: getBaseName(file.basename),
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
      AgentDataLoader.fromFile(arcana, file).then((agentData: AgentData) => {
        store.dispatch({
          type: 'agent/update',
          agent: agentData,
          old_name: getBaseName(oldPath),
        });
      });
    }
  };

  const addAllAgentsInFolder = () => {
    const folder = arcana.app.vault.getAbstractFileByPath(getAgentFolder());
    if (folder instanceof TFolder) {
      folder.children.forEach(createAgent);
    }
  };

  React.useEffect(() => {
    console.log('Registering events');

    arcana.registerEvent(arcana.app.vault.on('create', createAgent));
    arcana.registerEvent(arcana.app.vault.on('modify', onModify));
    arcana.registerEvent(arcana.app.vault.on('delete', onDelete));
    arcana.registerEvent(arcana.app.vault.on('rename', onRename));

    addAllAgentsInFolder();
    return () => {
      console.log('Unregistering events');
      arcana.app.vault.off('create', createAgent);
      arcana.app.vault.off('modify', onModify);
      arcana.app.vault.off('delete', onDelete);
      arcana.app.vault.off('rename', onRename);
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
      <Provider store={store}>
        <SocratesInnerView />
      </Provider>
    </div>
  );
};
//<h1>Socrates 🔮</h1>
//<ConversationDialogue current_file={file} systemMessage={systemMessage} />
