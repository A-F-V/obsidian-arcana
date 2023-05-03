import ArcanaPlugin from 'src/main';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { PolarisView } from './PolarisView';

export const POLARIS_VIEW_TYPE = 'polaris-view';

// The general boiler plate for creating an obsidian view
export class PolarisObsidianView extends ItemView {
  private arcana: ArcanaPlugin;

  constructor(leaf: any, arcana: ArcanaPlugin) {
    super(leaf);
    this.arcana = arcana;
  }

  getDisplayText(): string {
    return 'Polaris';
  }

  getIcon(): string {
    return 'star';
  }

  getViewType(): string {
    return POLARIS_VIEW_TYPE;
  }

  async onOpen(): Promise<void> {
    const root = createRoot(this.containerEl.children[1]);

    root.render(
      <React.StrictMode>
        <PolarisView arcana={this.arcana} />
      </React.StrictMode>
    );
  }

  async onClose(): Promise<void> {
    // Unmount the root
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
  }
}
