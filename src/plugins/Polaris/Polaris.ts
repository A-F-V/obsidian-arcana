// TODO: take out and turn into an actual plugin

import ArcanaPlugin from 'src/main';
import { Modal, Setting, App } from 'obsidian';

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

    this.arcana.addCommand({
      id: 'arcana-polaris-get-k-most-similar',
      name: 'Polaris Search',
      callback: async () => {
        this.requestSearchTerm();
      },
    });
  }

  private requestSearchTerm() {
    new PolarisModal(this.arcana.app, async result => {
      const closestFiles = await this.arcana.search(result, 5);

      console.log(closestFiles);
      // TODO: Test (currently returning nothing)
    }).open();
  }
}
