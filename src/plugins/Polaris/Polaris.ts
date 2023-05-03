// TODO: take out and turn into an actual plugin

import ArcanaPlugin from 'src/main';
import { Modal, Setting, App } from 'obsidian';
import { PolarisObsidianView, POLARIS_VIEW_TYPE } from './PolarisObsidianView';

class PolarisModal extends Modal {
  result: string;
  onSubmit: (result: string) => void;

  constructor(app: App, onSubmit: (result: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl('h1', { text: 'Polaris Search' });

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

export default class Polaris {
  private arcana: ArcanaPlugin;

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
  }
  async onload() {
    // Register the Polaris View on load
    this.arcana.registerView(
      POLARIS_VIEW_TYPE,
      leaf => new PolarisObsidianView(leaf, this.arcana)
    );

    // Render when the layout is ready
    this.arcana.app.workspace.onLayoutReady(() => {
      this.openPolarisView();
    });
  }

  async onunload() {
    // Close the view
    this.closePolarisView();
  }

  private requestSearchTerm() {
    new PolarisModal(this.arcana.app, async result => {
      const closestFiles = await this.arcana.search(result, 5);

      console.log(closestFiles);
      // TODO: Test (currently returning nothing)
    }).open();
  }

  private async openPolarisView() {
    // Check if it is already open
    console.log(this);

    const polarisViews =
      this.arcana.app.workspace.getLeavesOfType(POLARIS_VIEW_TYPE);
    if (polarisViews.length == 0) {
      // Need to first mount
      const leaf = this.arcana.app.workspace.getLeftLeaf(false);
      await leaf.setViewState({
        type: POLARIS_VIEW_TYPE,
      });
      this.arcana.app.workspace.revealLeaf(leaf);
    } else {
      // Already mounted
      // Just set as active
      this.arcana.app.workspace.revealLeaf(polarisViews[0]);
    }
  }
  private async closePolarisView() {
    const polarisViews =
      this.arcana.app.workspace.getLeavesOfType(POLARIS_VIEW_TYPE);
    for (const view of polarisViews) {
      await view.detach();
    }
  }
}
