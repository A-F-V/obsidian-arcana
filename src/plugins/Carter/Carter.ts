// TODO: take out and turn into an actual plugin

import ArcanaPlugin from 'src/main';
import { Modal, Setting, App } from 'obsidian';
import { CarterObsidianView, Carter_VIEW_TYPE } from './CarterObsidianView';

class CarterModal extends Modal {
  result: string;
  onSubmit: (result: string) => void;

  constructor(app: App, onSubmit: (result: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl('h1', { text: 'Carter Discover' });

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

export default class CarterPlugin {
  private arcana: ArcanaPlugin;

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
  }
  async onload() {
    // Register the Carter View on load
    this.arcana.registerView(
      Carter_VIEW_TYPE,
      leaf => new CarterObsidianView(leaf, this.arcana)
    );

    // Render when the layout is ready
    this.arcana.app.workspace.onLayoutReady(() => {
      this.openCarterView();
    });
  }

  async onunload() {
    // Close the view
    this.closeCarterView();
  }
  public addSettings(containerEl: HTMLElement) {}

  private async openCarterView() {
    // Check if it is already open

    const CarterViews =
      this.arcana.app.workspace.getLeavesOfType(Carter_VIEW_TYPE);
    if (CarterViews.length == 0) {
      // Need to first mount
      const leaf = this.arcana.app.workspace.getLeftLeaf(false);
      await leaf.setViewState({
        type: Carter_VIEW_TYPE,
      });
      this.arcana.app.workspace.revealLeaf(leaf);
    } else {
      // Already mounted
      // Just set as active
      this.arcana.app.workspace.revealLeaf(CarterViews[0]);
    }
  }
  private async closeCarterView() {
    const CarterViews =
      this.arcana.app.workspace.getLeavesOfType(Carter_VIEW_TYPE);
    for (const view of CarterViews) {
      await view.detach();
    }
  }
}
