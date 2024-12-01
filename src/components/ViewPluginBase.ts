import { Plugin, View, WorkspaceLeaf } from 'obsidian';
import { ObsidianView } from './ObsidianView';
import ArcanaPluginBase from './ArcanaPluginBase';
import { AIAgent } from '@/include/ai/AI';

export default abstract class ViewPluginBase<SettingsType> extends ArcanaPluginBase<SettingsType> {
  private viewType: string;
  private viewFactory: (leaf: WorkspaceLeaf) => View;

  constructor(
    agent: AIAgent,
    plugin: Plugin,
    settings: SettingsType,
    saveSettings: () => Promise<void>,
    viewType: string,
    icon: string,
    displayText: string,
    view: () => JSX.Element
  ) {
    super(agent, plugin, settings, saveSettings);
    this.viewType = viewType;
    this.viewFactory = (leaf: WorkspaceLeaf) => {
      return new ObsidianView(leaf, this.agent, this.plugin, viewType, icon, displayText, view);
    };
  }
  async onload() {
    // Register the view
    this.plugin.registerView(this.viewType, leaf => this.viewFactory(leaf));

    // Render when the layout is ready
    this.app.workspace.onLayoutReady(() => {
      this.activateView();
    });
  }

  async onunload() {
    // Close the view
    await this.closeView();
  }

  private async activateView() {
    // First close the view
    //await this.closeView();

    // If there are already views of this type, don't open a new one
    const leaves = this.app.workspace.getLeavesOfType(this.viewType);
    if (leaves.length > 0) return;

    // Associate the view with a fresh left leaf
    this.app.workspace.getLeftLeaf(false)?.setViewState({
      type: this.viewType,
    });
  }

  private async closeView() {
    // Detach the view
    this.app.workspace.detachLeavesOfType(this.viewType);
  }
}
