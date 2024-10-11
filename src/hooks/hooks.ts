import { ArcanaContext } from './context';
import * as React from 'react';
import ArcanaPlugin from 'src/main';

export const useArcana = (): ArcanaPlugin => {
  // Use ArcanaContext but throw an error if it's null
  const arcana = React.useContext(ArcanaContext);
  if (arcana == null) {
    throw new Error('ArcanaContext is null');
  }
  return arcana;
};
