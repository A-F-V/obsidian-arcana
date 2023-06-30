import { AgentData } from './ConversationAgent';
import { Author, Message } from './Message';
import SerializableAborter from 'src/include/Aborter';
import { configureStore } from '@reduxjs/toolkit';
import ArcanaPlugin from 'src/main';
import { TFile } from 'obsidian';
import { Reducer } from 'redux';
// TODO: Typing

// action: { type: 'agent/add', agent: AgentData , arcana: ArcanaPlugin }
// State type
export type ChatAgentState = {
  agents: { [key: string]: { agent: AgentData; messages: Message[] } };
};

const initialState: ChatAgentState = {
  agents: {},
};

interface AddAgentAction {
  type: 'agent/add';
  agent: AgentData;
}

interface RemoveAgentAction {
  type: 'agent/remove';
  name: string;
}
interface UpdateAgentAction {
  type: 'agent/update';
  agent: AgentData;
  old_name: string;
}

interface CreateUserMessageAction {
  type: 'conv/create_user_message';
  text: string;
}

interface CreateAIMessageAction {
  type: 'conv/create_ai_message';
}

interface UpdateAIMessageAction {
  type: 'conv/update_ai_message';
  text: string;
}

export type ChatAgentAction =
  | AddAgentAction
  | RemoveAgentAction
  | UpdateAgentAction
  | CreateUserMessageAction
  | CreateAIMessageAction
  | UpdateAIMessageAction;

function isSerializable(x: any) {
  try {
    JSON.stringify(x);
    return true;
  } catch (error) {
    return false;
  }
}

function ChatAgentReducer(state = initialState, action: ChatAgentAction) {
  console.log('ChatAgentReducer', action, state);
  console.log('isSerializable action', isSerializable(action));
  console.log('isSerializable state', isSerializable(state));
  switch (action.type) {
    case 'agent/add': {
      const agent: AgentData = action.agent;
      // IDEMPOTENT

      return {
        ...state,
        agents: {
          ...state.agents,
          [agent.name]: { agent, messages: [] },
        },
      };
    }
    case 'agent/remove': {
      const name = action.name;
      if (!state.agents[name]) return state;
      else {
        const agents = { ...state.agents };
        delete agents[name];
        return {
          ...state,
          agents,
        };
      }
    }

    case 'agent/update': {
      // If old name does not exist, return state
      const old_name = action.old_name;
      if (!state.agents[old_name]) return state;
      else {
        // Do agent/remove then agent/add
        const agents = { ...state.agents };
        const old_messages = agents[old_name].messages;
        delete agents[old_name];
        const agent: AgentData = action.agent;
        return {
          ...state,
          agents: {
            ...agents,
            [agent.name]: { agent, messages: old_messages },
          },
        };
      }
    }

    //  break;
    /* case 'conv/create_user_message': {
      const agent: AgentData = action.agent;
      const conv = state.agents[agent.file.name];
      const message = new Message(Author.User);
      message.addText(action.text);
      conv.messages.push(message);
      return {
        ...state,
        agents: {
          ...state.agents,
          [agent.file.name]: conv,
        },
      };
    }
    case 'conv/create_ai_message': {
      const agent: AgentData = action.agent;
      const conv = state.agents[agent.file.name];

      const message = new Message(Author.AI);
      conv.convState.messageBeingWritten = true;
      conv.convState.currentAIMessage = message;
      conv.convState.currentAborter = new Aborter();

      conv.messages.push(message);
      return {
        ...state,
        agents: {
          ...state.agents,
          [agent.file.name]: conv,
        },
      };
    }
    case 'conv/reset': {
      const agent: AgentData = action.agent;
      const conv = state.agents[agent.file.name];
      conv.aiConv.disengage();
      conv.aiConv = state.arcana?.startConversation(agent.initialMessage);
      conv.convState = new ConvState();
      return {
        ...state,
        agents: {
          ...state.agents,
          [agent.file.name]: conv,
        },
      };
    }
    case 'conv/end_ai_message': {
      const agent: AgentData = action.agent;
      const conv = state.agents[agent.file.name];
      conv.convState.messageBeingWritten = false;
      conv.convState.currentAIMessage = null;
      conv.convState.currentAborter = new Aborter();
      return {
        ...state,
        agents: {
          ...state.agents,
          [agent.file.name]: conv,
        },
      };
    }
    case 'conv/add_to_ai_message': {
      const agent: AgentData = action.agent;
      const conv = state.agents[agent.file.name];
      const message = conv.convState.currentAIMessage;
      message.addText(action.text);
      return {
        ...state,
        agents: {
          ...state.agents,
          [agent.file.name]: conv,
        },
      };
    }
    case 'conv/abort': {
      const agent: AgentData = action.agent;
      const conv = state.agents[agent.file.name];
      conv.convState.currentAborter.abort();
      return state;
    }*/
    default:
      return state;
  }
}

const store = configureStore({
  reducer: ChatAgentReducer as Reducer<ChatAgentState, ChatAgentAction>,
});
export default store;
