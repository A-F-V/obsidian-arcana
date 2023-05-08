// TODO: take out and turn into an actual plugin

import ArcanaPlugin from 'src/main';
import { Modal, Setting, App } from 'obsidian';
import {
  ColumbusObsidianView,
  Columbus_VIEW_TYPE,
} from './ColumbusObsidianView';

class ColumbusModal extends Modal {
  result: string;
  onSubmit: (result: string) => void;

  constructor(app: App, onSubmit: (result: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl('h1', { text: 'Columbus Search' });

    new Setting(contentEl).setName('Query').addText(text =>
      text.onChange(value => {
        this.result = value;
      })
    );

    new Setting(contentEl).addButton(btn =>
      btn
        .setButtonText('Submit')
        .setCta()
        .onClick(() => {
          this.close();
          this.onSubmit(this.result);
        })
    );

    // When you press enter, submit
    contentEl.addEventListener('keyup', event => {
      if (event.key === 'Enter') {
        this.close();
        this.onSubmit(this.result);
      }
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export default class ColumbusPlugin {
  private arcana: ArcanaPlugin;

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
  }
  async onload() {
    // Register the Columbus View on load
    this.arcana.registerView(
      Columbus_VIEW_TYPE,
      leaf => new ColumbusObsidianView(leaf, this.arcana)
    );

    // Render when the layout is ready
    this.arcana.app.workspace.onLayoutReady(() => {
      this.openColumbusView();
    });
  }

  async onunload() {
    // Close the view
    this.closeColumbusView();
  }
  public addSettings(containerEl: HTMLElement) {}

  private async openColumbusView() {
    // Check if it is already open

    const ColumbusViews =
      this.arcana.app.workspace.getLeavesOfType(Columbus_VIEW_TYPE);
    if (ColumbusViews.length == 0) {
      // Need to first mount
      const leaf = this.arcana.app.workspace.getLeftLeaf(false);
      await leaf.setViewState({
        type: Columbus_VIEW_TYPE,
      });
      this.arcana.app.workspace.revealLeaf(leaf);
    } else {
      // Already mounted
      // Just set as active
      this.arcana.app.workspace.revealLeaf(ColumbusViews[0]);
    }
  }
  private async closeColumbusView() {
    const ColumbusViews =
      this.arcana.app.workspace.getLeavesOfType(Columbus_VIEW_TYPE);
    for (const view of ColumbusViews) {
      await view.detach();
    }
  }
}
