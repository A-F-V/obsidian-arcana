import { App, Modal, Notice, Setting, TFolder } from 'obsidian';

export default class PoloApprovalModal extends Modal {
  private suggestions: Record<string, string>;
  private moveFile: (oldPath: string, newFolder: string) => void;

  constructor(
    app: App,
    suggestions: Record<string, TFolder | null>,
    moveFile: (oldPath: string, newFolder: string) => void
  ) {
    super(app);

    this.suggestions = {};
    this.moveFile = moveFile;
    for (const oldPath in suggestions) {
      this.suggestions[oldPath] = suggestions[oldPath]?.path ?? '';
    }
  }

  onOpen() {
    // Using React
    const { contentEl } = this;

    contentEl.createEl('h1', {
      text: 'Suggestion for New Folder Destinations',
    });
    contentEl.createEl('p', {
      text: 'All empty destinations leave file unmoved.',
    });

    for (const oldpath in this.suggestions) {
      const fileName = PoloApprovalModal.getFileName(oldpath);
      // A css class that makes input fill the width of their input.
      new Setting(contentEl)
        .setName(fileName)
        .addText(text =>
          text.setDisabled(true).setValue(this.suggestions[oldpath])
        )
        .setClass('wide-input');
    }

    new Setting(contentEl).addButton(btn =>
      btn
        .setButtonText('Submit')
        .setCta()
        .onClick(() => {
          this.close();
          for (const oldPath in this.suggestions) {
            const newFolder = this.suggestions[oldPath];
            if (newFolder === '') {
              new Notice(`No good folder was found for ${oldPath}`);
            } else {
              this.moveFile(oldPath, newFolder);
            }
          }
          console.log(this.suggestions);
        })
    );
  }

  private static getFileName(path: string): string {
    return path.split('/').pop() ?? '';
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
