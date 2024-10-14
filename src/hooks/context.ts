import { AIAgent } from '@/include/ai/AI';
import { App, Plugin } from 'obsidian';
import * as React from 'react';

export interface ArcanaContextInfo {
  app: App;
  plugin: Plugin;
  agent: AIAgent;
}
export const ArcanaContext = React.createContext<ArcanaContextInfo | null>(null);

export type MicrophoneContextInfo = {
  toggleMicrophone: () => void;
};

export const MicrophoneContext = React.createContext<MicrophoneContextInfo>({
  toggleMicrophone: () => {},
});
