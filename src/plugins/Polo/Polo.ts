import {
  Editor,
  MarkdownView,
  Notice,
  Setting,
  TAbstractFile,
  TFile,
  TFolder,
} from 'obsidian';
import ArcanaPluginBase from 'src/components/ArcanaPluginBase';
import {
  FSTraversalNode,
  FSTraversalOperators,
  FSTraverser,
} from 'src/include/FileSystemCrawler';

import PoloApprovalModal from './PoloApprovalModal';

export default class PoloPlugin extends ArcanaPluginBase {
  private priorInstruction = '';

  public addSettings(containerEl: HTMLElement) {
    containerEl.createEl('h1', { text: 'Polo' });
    new Setting(containerEl)
      .setName("Polo's additional context")
      .setDesc('The prior instruction given to Polo')
      .addTextArea(text => {
        text
          .setPlaceholder('')
          .setValue(this.priorInstruction)
          .onChange(async (value: string) => {
            this.priorInstruction = value;
            this.arcana.settings.PluginSettings['Polo'] = {
              priorInstruction: value,
            };
            await this.arcana.saveSettings();
          });
      });
  }

  public async onload() {
    this.priorInstruction =
      this.arcana.settings.PluginSettings['Polo']?.priorInstruction ?? '';
    // TODO: Logic is very similar to DarwinPlugin so refactor
    // Register the Polo command
    this.arcana.addCommand({
      id: 'polo',
      name: 'Polo Move',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const file = view.file;
        if (!file) {
          new Notice('Darwin: No file selected');
          return;
        }
        this.runPolo([file]);
      },
    });
  }

  private runPolo(files: TFile[]): void {
    this.requestNewFileLocations(files).then(
      (suggestions: Record<string, TFolder | null>) => {
        new PoloApprovalModal(this.arcana.app, suggestions).open();
      }
    );
  }

  private async requestNewFileLocations(
    files: TFile[]
  ): Promise<Record<string, TFolder | null>> {
    // 1) Ask Polo for the new file locations
    const response = await this.askPolo(files);
    console.log(response);
    // 2) Parse the response
    const fileLocations = this.parsePoloResponse(response);
    // 3) Return
    console.log(fileLocations);
    return fileLocations;
  }

  private parsePoloResponse(response: string): Record<string, TFolder | null> {
    const lines = response.split('\n');
    const fileLocations: Record<string, TFolder | null> = {};
    for (const line of lines) {
      // Regex to match the following:
      // [File Name] [Folder Path]
      const regex = /\[(.*)\] \[(.*)\]/;
      const matches = line.match(regex);
      if (matches) {
        const oldPath = matches[1];
        const newFolder = matches[2];
        const oldFile = this.arcana.app.vault.getAbstractFileByPath(oldPath);
        const newFolderPath =
          this.arcana.app.vault.getAbstractFileByPath(newFolder);
        if (oldFile === null || newFolderPath === null) {
          // Bad old Path or new Folder
          fileLocations[oldPath] = null;
          continue;
        }
        console.debug(`oldFile: ${oldFile.name} newFolder: ${newFolder}`);
        fileLocations[oldPath] = newFolderPath as TFolder;
      }
    }
    return fileLocations;
  }

  public async onunload() {}

  private getPoloContext(): string {
    const purpose =
      'You are an AI assistant that helps suggest file locations to move files to based on an existing folder structure.';

    const instructions = `
    - You will be given a list of file names. Each file will have a title and content shown to you.
    - Below is the "File System" section. It shows you the current folder structure of the vault.
    - You must suggest a new folder to move each file to. Your decision should take into consideration:
      - The title and contents of the file.
      - The purpose of each folder tree based on its name as well as the files it contains.
    - Your answers should be in the following format:
    ''
    [Old File Path] [New Folder]\\n
    [Old File Path] [New Folder]\\n
    ...
    ''
    - The new folder must be an existing path from the File System section
    - The old file path must be exactly the same as the file name given to you
    - For example:
    ''
    [unsorted/trees.md] [hobbies/gardening]\\n
    ''
    `;

    const traverser = new FSTraverser(this.arcana.app.vault);
    const traversal = traverser.traverse();
    // Only consider .md files and folders.
    //traversal = FSTraversalOperators.filterFiles(traversal);
    const fs = FSTraversalOperators.prettyPrint(traversal);

    const context = `
    [Purpose]
    ${purpose}
    [Primary Instructions]
    ${instructions}
    [Additional Instructions]
    ${this.priorInstruction}
    [File System]
    ${fs}
    `;

    return context;
  }

  private async askPolo(files: TFile[]): Promise<string> {
    let details = '';
    for (const file of files) {
      const path = file.path;
      const content = await this.arcana.app.vault.read(file);
      details += `
      [New File]
      [Old File Path]
      ${path}
      [File Content]
      ${content}
      [End of File]`;
    }

    const context = this.getPoloContext();
    console.log(context);
    console.log(details);
    const response = await this.arcana.complete(details, context);
    return response;
  }
}
