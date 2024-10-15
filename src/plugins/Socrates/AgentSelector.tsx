import * as React from 'react';
import Select from 'react-select';
import { useSelector } from 'react-redux';
import { ChatAgentState } from './AgentState';

export default function AgentSelector({ setCurrentAgent }: { setCurrentAgent: (agentName: string | null) => void }) {
  type AgentOption = { value: string; label: string }[];

  const availableAgents = useSelector<ChatAgentState>((state: ChatAgentState) => {
    return Object.values(state.agents).map(({ agent }) => {
      return {
        value: agent.name,
        label: `${agent.agentEmoji} ${agent.name}`,
      };
    });
  }) as AgentOption;

  return (
    <div>
      <Select options={availableAgents} onChange={(newValue, action) => setCurrentAgent(newValue?.value ?? null)} />
    </div>
  );
}
