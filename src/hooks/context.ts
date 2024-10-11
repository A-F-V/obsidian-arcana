import * as React from 'react';
import ArcanaPlugin from 'src/main';

export const ArcanaContext = React.createContext<ArcanaPlugin | null>(null);

export type MicrophoneContextInfo = {
  toggleMicrophone: () => void;
};

export const MicrophoneContext = React.createContext<MicrophoneContextInfo>({
  toggleMicrophone: () => {},
});
