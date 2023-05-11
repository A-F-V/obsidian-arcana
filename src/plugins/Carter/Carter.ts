// TODO: take out and turn into an actual plugin

import ViewPluginBase from 'src/components/ViewPluginBase';
import ArcanaPlugin from 'src/main';
import { CarterView } from 'src/plugins/Carter/CarterView';

export default class CarterPlugin extends ViewPluginBase {
  constructor(arcana: ArcanaPlugin) {
    super(arcana, 'carter-view', 'compass', 'Carter', CarterView);
  }
}
