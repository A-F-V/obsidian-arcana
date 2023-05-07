import ViewPluginBase from 'src/components/ViewPluginBase';
import ArcanaPlugin from 'src/main';
import {
  SOCRATES_VIEW_TYPE,
  SocratesObsidianView,
} from './SocratesObsidianView';

export default class SocratesPlugin extends ViewPluginBase {
  constructor(arcana: ArcanaPlugin) {
    super(arcana, SOCRATES_VIEW_TYPE, (leaf, arcana) => {
      return new SocratesObsidianView(leaf, arcana);
    });
  }
}
