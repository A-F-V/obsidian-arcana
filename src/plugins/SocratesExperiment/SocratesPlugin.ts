import ViewPluginBase from 'src/components/ViewPluginBase';
import ArcanaPlugin from 'src/main';
import { SocratesView } from 'src/plugins/SocratesExperiment/SocratesView';

export default class SocratesPlugin extends ViewPluginBase {
  constructor(arcana: ArcanaPlugin) {
    super(arcana, 'socrates-view', 'book', 'socrates', SocratesView);
  }
}
