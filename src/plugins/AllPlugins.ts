import ArcanaPluginBase from '@/components/ArcanaPluginBase';
import { defaultChristieSettings, ChristieSettings } from './Christie/ChristieSettings';
import { defaultDarwinSettings, DarwinSettings } from './Darwin/DarwinSettings';
import { defaultFeynmanSettings, FeynmanSettings } from './Feynman/FeynmanSettings';
import { defaultFordSettings, FordSettings } from './Ford/FordSettings';
import { defaultNostradamusSettings, NostradamusSettings } from './Nostradamus/NostradamusSettings';
import { defaultPoloSettings, PoloSettings } from './Polo/PoloSettings';
import { defaultSocratesSettings, SocratesSettings } from './Socrates/SocratesSettings';

export type AvailablePlugins = 'christie' | 'darwin' | 'feynman' | 'ford' | 'nostradamus' | 'polo' | 'socrates';

export interface AvailablePluginSettings {
  christie: ChristieSettings;
  darwin: DarwinSettings;
  feynman: FeynmanSettings;
  ford: FordSettings;
  nostradamus: NostradamusSettings;
  polo: PoloSettings;
  socrates: SocratesSettings;
}

export type AvailablePluginTypes = ArcanaPluginBase<AvailablePluginSettings[AvailablePlugins]>;

export const defaultPluginSettings: AvailablePluginSettings = {
  christie: defaultChristieSettings,
  darwin: defaultDarwinSettings,
  feynman: defaultFeynmanSettings,
  ford: defaultFordSettings,
  nostradamus: defaultNostradamusSettings,
  polo: defaultPoloSettings,
  socrates: defaultSocratesSettings,
};

export type AvailablePluginSettingsTypes = AvailablePluginSettings[AvailablePlugins];
