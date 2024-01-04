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

    for (const oldpath in this.suggestions) {
      const fileName = PoloApprovalModal.getFileName(oldpath);
      const newFolder = this.suggestions[oldpath];
      const canMove = newFolder !== '';

      const dest = canMove ? `-> ${newFolder}` : `No good folder`;

      this.moveList[oldpath] = canMove;
      new Setting(contentEl)
        .setName(fileName)
        .addToggle(toggle =>
          toggle
            .setDisabled(!canMove)
            .onChange(value => {
              this.moveList[oldpath] = value;
            })
            .setValue(canMove)
        )
        .setDesc(dest);

      /*
      if (!canMove) {
        cont.createEl('strong', { text: `No good folder` });
      } else {
        cont.createEl('span', { text: ` ->  ${newFolder}` });
      }
      */
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
