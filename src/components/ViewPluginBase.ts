import { View, WorkspaceLeaf } from 'obsidian';
import ArcanaPlugin from 'src/main';
import { ObsidianView } from './ObsidianView';
import ArcanaPluginBase from './ArcanaPluginBase';

export default abstract class ViewPluginBase extends ArcanaPluginBase {
  protected arcana: ArcanaPlugin;
  private viewType: string;
  private leaf: WorkspaceLeaf;

  private viewFactory: (leaf: WorkspaceLeaf) => View;

  constructor(
    arcana: ArcanaPlugin,
    viewType: string,
    icon: string,
    displayText: string,
    view: () => JSX.Element
  ) {
    super();
    this.arcana = arcana;
    this.viewFactory = (leaf: WorkspaceLeaf) => {
      return new ObsidianView(leaf, arcana, viewType, icon, displayText, view);
    };
  }
  async onload() {
    // Register the Carter View on load
    this.arcana.registerView(this.viewType, leaf => this.viewFactory(leaf));

    // Render when the layout is ready
    this.arcana.app.workspace.onLayoutReady(() => {
      this.openView();
    });
  }

  async onunload() {
    // Close the view
    this.closeView();
  }

  private async openView() {
    // Check if it is already open
    const views = this.arcana.app.workspace.getLeavesOfType(this.viewType);
    if (views.length == 0) {
      // Need to first mount
      this.leaf = this.arcana.app.workspace.getLeftLeaf(false); // TODO: Abstract this
      await this.leaf.setViewState({
        type: this.viewType,
      });
      this.arcana.app.workspace.revealLeaf(this.leaf);
    } else {
      // Already mounted
      // Just set as active
      this.arcana.app.workspace.revealLeaf(views[0]);
    }
  }
  private async closeView() {
    this.leaf.detach();
  }
}
