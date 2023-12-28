import { App, Modal, Notice, Setting, TFolder } from 'obsidian';

export default class PoloApprovalModal extends Modal {
  private suggestions: Record<string, string>;
  private moveList: Record<string, boolean> = {};

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
      const newFolder = this.suggestions[oldpath];
      const canMove = newFolder !== '';
      const cont = contentEl.createEl('div');

      // Make flow vertical
      cont.style.display = 'flex';
      cont.style.flexDirection = 'column';
      cont.style.marginBottom = '1em';
      cont.style.borderBottom = '1px solid var(--background-secondary)';

      this.moveList[oldpath] = canMove;
      new Setting(cont).setName(fileName).addToggle(toggle =>
        toggle
          .setDisabled(!canMove)
          .onChange(value => {
            this.moveList[oldpath] = value;
          })
          .setValue(canMove)
      );

      if (!canMove) {
        cont.createEl('strong', { text: `No good folder` });
      } else {
        cont.createEl('span', { text: ` ->  ${newFolder}` });
      }
    }

    new Setting(contentEl).addButton(btn =>
      btn
        .setButtonText('Move All Selected')
        .setCta()
        .onClick(() => {
          this.close();
          for (const oldPath in this.suggestions) {
            const newFolder = this.suggestions[oldPath];
            const onMoveList = this.moveList[oldPath];
            if (onMoveList) {
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
