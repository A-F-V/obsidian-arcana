import { AgentData } from './ConversationAgent';
import { Author, Message } from './Message';
import SerializableAborter from 'src/include/Aborter';
import { configureStore } from '@reduxjs/toolkit';
import ArcanaPlugin from 'src/main';
import { TFile } from 'obsidian';
import { AnyAction, Reducer } from 'redux';
import { findLastIndex } from 'src/include/Functional';

export type ChatAgentState = {
  agents: { [key: string]: { agent: AgentData; messages: Message[] } };
};

const initialState: ChatAgentState = {
  agents: {},
};

// action: { type: 'agent/add', agent: AgentData , arcana: ArcanaPlugin }
// State type

export enum ChatActionTypes {
  ADD_AGENT = 'agent/add',
  REMOVE_AGENT = 'agent/remove',
  UPDATE_AGENT = 'agent/update',
  CREATE_USER_MESSAGE = 'conv/create_user_message',
  CREATE_AI_MESSAGE = 'conv/create_ai_message',
  APPEND_TO_LAST_AI_MESSAGE = 'conv/append_to_last_ai_message',
  RESET_AGENT_CONVERSATION = 'conv/reset_agent_conversation',
}

interface AddAgentAction extends AnyAction {
  type: ChatActionTypes.ADD_AGENT;
  agent: AgentData;
}

interface RemoveAgentAction extends AnyAction {
  type: ChatActionTypes.REMOVE_AGENT;
  name: string;
}
interface UpdateAgentAction extends AnyAction {
  type: ChatActionTypes.UPDATE_AGENT;
  agent: AgentData;
  old_name: string;
}

interface CreateUserMessageAction extends AnyAction {
  type: ChatActionTypes.CREATE_USER_MESSAGE;
  agentName: string;
  text: string;
}

interface CreateAIMessageAction extends AnyAction {
  type: ChatActionTypes.CREATE_AI_MESSAGE;
  agentName: string;
}

interface UpdateLastAIMessageAction extends AnyAction {
  type: ChatActionTypes.APPEND_TO_LAST_AI_MESSAGE;
  agentName: string;
  text: string;
}

interface ResetAgentConversatinAction extends AnyAction {
  type: ChatActionTypes.RESET_AGENT_CONVERSATION;
  agentName: string;
}

export type ChatAgentAction =
  | AddAgentAction
  | RemoveAgentAction
  | UpdateAgentAction
  | CreateUserMessageAction
  | CreateAIMessageAction
  | UpdateLastAIMessageAction
  | ResetAgentConversatinAction;

function isSerializable(x: any) {
  try {
    JSON.stringify(x);
    return true;
  } catch (error) {
    return false;
  }
}

function ChatAgentReducer(state = initialState, action: ChatAgentAction) {
  // console.log('ChatAgentReducer', action, state);
  // console.log('isSerializable action', isSerializable(action));
  // console.log('isSerializable state', isSerializable(state));
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

    case 'conv/create_user_message': {
      const agentName = action.agentName;
      const { agent, messages } = state.agents[agentName];
      const message: Message = { text: action.text, author: Author.User };
      return {
        ...state,
        agents: {
          ...state.agents,
          [agentName]: { agent, messages: [...messages, message] },
        },
      };
    }
    case ChatActionTypes.CREATE_AI_MESSAGE: {
      const agentName: string = action.agentName;
      const { agent, messages } = state.agents[agentName];
      const message: Message = { text: '', author: Author.AI };
      return {
        ...state,
        agents: {
          ...state.agents,
          [agentName]: { agent, messages: [...messages, message] },
        },
      };
    }
    case ChatActionTypes.APPEND_TO_LAST_AI_MESSAGE: {
      const agentName: string = action.agentName;
      const { agent, messages } = state.agents[agentName];
      // Get index of last AI message
      // Do not mutate the
      const index = findLastIndex(messages, m => m.author === Author.AI);
      if (index === -1) return state;
      // Create a new message
      const message: Message = {
        text: messages[index].text + action.text,
        author: Author.AI,
      };

      return {
        ...state,
        agents: {
          ...state.agents,
          [agentName]: {
            agent,
            messages: [
              ...messages.slice(0, index),
              message,
              ...messages.slice(index + 1),
            ],
          },
        },
      };
    }
    case ChatActionTypes.RESET_AGENT_CONVERSATION: {
      const agentName: string = action.agentName;
      const { agent } = state.agents[agentName];
      return {
        ...state,
        agents: {
          ...state.agents,
          [agentName]: { agent, messages: [] },
        },
      };
    }
    /*
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
export type StoreDispatch = typeof store.dispatch;
