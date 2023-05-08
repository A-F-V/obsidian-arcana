import ArcanaPlugin from 'src/main';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { ColumbusView } from './ColumbusView';

export const Columbus_VIEW_TYPE = 'Columbus-view';

// The general boiler plate for creating an obsidian view
export class ColumbusObsidianView extends ItemView {
  private arcana: ArcanaPlugin;

  constructor(leaf: any, arcana: ArcanaPlugin) {
    super(leaf);
    this.arcana = arcana;
  }

  getDisplayText(): string {
    return 'Columbus';
  }

  getIcon(): string {
    return 'star';
  }

  getViewType(): string {
    return Columbus_VIEW_TYPE;
  }

  async onOpen(): Promise<void> {
    const root = createRoot(this.containerEl.children[1]);

    root.render(
      <React.StrictMode>
        <ColumbusView arcana={this.arcana} />
      </React.StrictMode>
    );
  }

  async onClose(): Promise<void> {
    // Unmount the root
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
  }
}
