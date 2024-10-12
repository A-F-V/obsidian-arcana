import { View, WorkspaceLeaf } from 'obsidian';
import ArcanaPlugin from 'src/main';
import { ObsidianView } from './ObsidianView';
import ArcanaPluginBase from './ArcanaPluginBase';

export default abstract class ViewPluginBase<
  SettingsType
> extends ArcanaPluginBase<SettingsType> {
  private viewType: string;
  private viewFactory: (leaf: WorkspaceLeaf) => View;

  constructor(
    arcana: ArcanaPlugin,
    settings: SettingsType,
    viewType: string,
    icon: string,
    displayText: string,
    view: () => JSX.Element
  ) {
    super(arcana, settings);
    this.viewType = viewType;
    this.viewFactory = (leaf: WorkspaceLeaf) => {
      return new ObsidianView(leaf, arcana, viewType, icon, displayText, view);
    };
  }
  async onload() {
    // Register the view if it's not already registered
    if (!this.arcana.app.workspace.getLeavesOfType(this.viewType).length) {
      this.arcana.registerView(this.viewType, leaf => this.viewFactory(leaf));
    }

    // Render when the layout is ready
    this.arcana.app.workspace.onLayoutReady(() => {
      this.activateView();
    });
  }

  async onunload() {
    // Close the view
    await this.closeView();
  }

  private async activateView() {
    // First close the view
    await this.closeView();
    // If there are already views of this type, don't open a new one
    if (this.arcana.app.workspace.getLeavesOfType(this.viewType).length > 0)
      return;
    // Associate the view with a fresh left leaf
    this.arcana.app.workspace.getLeftLeaf(false)?.setViewState({
      type: this.viewType,
    });
  }

  private async closeView() {
    // Detach the view
    this.arcana.app.workspace.detachLeavesOfType(this.viewType);
  }
}
