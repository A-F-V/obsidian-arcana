import ArcanaPlugin from 'src/main';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { CarterView } from './CarterView';

export const Carter_VIEW_TYPE = 'Carter-view';

// The general boiler plate for creating an obsidian view
export class CarterObsidianView extends ItemView {
  private arcana: ArcanaPlugin;

  constructor(leaf: any, arcana: ArcanaPlugin) {
    super(leaf);
    this.arcana = arcana;
  }

  getDisplayText(): string {
    return 'Carter';
  }

  getIcon(): string {
    return 'star';
  }

  getViewType(): string {
    return Carter_VIEW_TYPE;
  }

  async onOpen(): Promise<void> {
    const root = createRoot(this.containerEl.children[1]);

    root.render(
      <React.StrictMode>
        <CarterView arcana={this.arcana} />
      </React.StrictMode>
    );
  }

  async onClose(): Promise<void> {
    // Unmount the root
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
  }
}
