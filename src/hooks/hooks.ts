import { ArcanaContext, ArcanaContextInfo } from './context';
import * as React from 'react';

export const useArcana = (): ArcanaContextInfo => {
  // Use ArcanaContext but throw an error if it's null
  const arcana = React.useContext(ArcanaContext);
  if (arcana == null) {
    throw new Error('ArcanaContext is null');
  }
  return arcana;
};
