import { ChristieSettings, defaultChristieSettings } from './Christie/Christie';
import { DarwinSettings, defaultDarwinSettings } from './Darwin/Darwin';
import { defaultFeynmanSettings, FeynmanSettings } from './Feynman/Feynman';
import { defaultFordSettings, FordSettings } from './Ford/Ford';
import {
  defaultNostradamusSettings,
  NostradamusSettings,
} from './Nostradamus/Nostradamus';
import { defaultPoloSettings, PoloSettings } from './Polo/Polo';
import {
  defaultSocratesSettings,
  SocratesSettings,
} from './Socrates/SocratesPlugin';

export type AvailablePlugins =
  | 'christie'
  | 'darwin'
  | 'feynman'
  | 'ford'
  | 'nostradamus'
  | 'polo'
  | 'socrates';

export interface AvailablePluginSettings {
  christie: ChristieSettings;
  darwin: DarwinSettings;
  feynman: FeynmanSettings;
  ford: FordSettings;
  nostradamus: NostradamusSettings;
  polo: PoloSettings;
  socrates: SocratesSettings;
}

export const defaultPluginSettings: AvailablePluginSettings = {
  christie: defaultChristieSettings,
  darwin: defaultDarwinSettings,
  feynman: defaultFeynmanSettings,
  ford: defaultFordSettings,
  nostradamus: defaultNostradamusSettings,
  polo: defaultPoloSettings,
  socrates: defaultSocratesSettings,
};
