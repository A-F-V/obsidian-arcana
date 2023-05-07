import ArcanaPlugin from 'src/main';
import { ItemView } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { SocratesView } from './SocratesView';

export const SOCRATES_VIEW_TYPE = 'socrates-view';

// The general boiler plate for creating an obsidian view
export class SocratesObsidianView extends ItemView {
  private arcana: ArcanaPlugin;

  constructor(leaf: any, arcana: ArcanaPlugin) {
    super(leaf);
    this.arcana = arcana;
  }

  getDisplayText(): string {
    return 'socrates';
  }

  getIcon(): string {
    return 'book';
  }

  getViewType(): string {
    return SOCRATES_VIEW_TYPE;
  }

  async onOpen(): Promise<void> {
    const root = createRoot(this.containerEl.children[1]);

    root.render(
      <React.StrictMode>
        <SocratesView arcana={this.arcana} />
      </React.StrictMode>
    );
  }

  async onClose(): Promise<void> {
    // Unmount the root
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
  }
}
