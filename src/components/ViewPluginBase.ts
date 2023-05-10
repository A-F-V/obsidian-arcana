import { View, WorkspaceLeaf } from 'obsidian';
import ArcanaPlugin from 'src/main';

export default class ViewPluginBase {
  private arcana: ArcanaPlugin;
  private viewType: string;
  private viewFactory: (leaf: WorkspaceLeaf, arcana: ArcanaPlugin) => View;

  constructor(
    arcana: ArcanaPlugin,
    viewType: string,
    viewFactory: (leaf: WorkspaceLeaf, arcana: ArcanaPlugin) => View
  ) {
    this.arcana = arcana;
    this.viewType = viewType;
    this.viewFactory = viewFactory;
  }
  async onload() {
    // Register the Carter View on load
    this.arcana.registerView(this.viewType, leaf =>
      this.viewFactory(leaf, this.arcana)
    );

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
      const leaf = this.arcana.app.workspace.getLeftLeaf(false); // TODO: Abstract this
      await leaf.setViewState({
        type: this.viewType,
      });
      this.arcana.app.workspace.revealLeaf(leaf);
    } else {
      // Already mounted
      // Just set as active
      this.arcana.app.workspace.revealLeaf(views[0]);
    }
  }
  private async closeView() {
    const CarterViews = this.arcana.app.workspace.getLeavesOfType(
      this.viewType
    );
    for (const view of CarterViews) {
      await view.detach();
    }
  }
}
