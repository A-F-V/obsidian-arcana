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
import { merge } from 'src/include/Functional';
import FrontMatterManager from 'src/include/FrontMatterManager';

type PoloSettings = {
  priorInstruction: string;
  showFilesInFolderStructure: boolean;
  showFileContent: boolean;
};

const DEFAULT_SETTINGS: PoloSettings = {
  priorInstruction: '',
  showFilesInFolderStructure: false,
  showFileContent: false,
};

export default class PoloPlugin extends ArcanaPluginBase {
  private settings: PoloSettings = DEFAULT_SETTINGS;

  public addSettings(containerEl: HTMLElement) {
    containerEl.createEl('h1', { text: 'Polo' });

    const saveSettings = async () => {
      this.arcana.settings.PluginSettings['Polo'] = this.settings;
      await this.arcana.saveSettings();
    };
    new Setting(containerEl)
      .setName("Polo's additional context")
      .setDesc('The prior instruction given to Polo')
      .addTextArea(text => {
        text
          .setPlaceholder('')
          .setValue(this.settings.priorInstruction)
          .onChange(async (value: string) => {
            this.settings.priorInstruction = value;
            await saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Show files in folder structure')
      .setDesc(
        'Whether to show files in the folder structure (costs more tokens)'
      )
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.showFilesInFolderStructure)
          .onChange(async (value: boolean) => {
            this.settings.showFilesInFolderStructure = value;
            await saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Show file content')
      .setDesc('Whether to show the contents of files (costs more tokens)')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.showFileContent)
          .onChange(async (value: boolean) => {
            this.settings.showFileContent = value;
            await saveSettings();
          });
      });
  }

  public async onload() {
    this.settings = merge(
      this.arcana.settings.PluginSettings['Polo'] as PoloSettings,
      DEFAULT_SETTINGS
    );
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

    this.arcana.registerEvent(
      this.arcana.app.workspace.on(
        'file-menu',
        async (menu, tfile: TAbstractFile) => {
          if (tfile instanceof TFile) {
            menu.addItem(item => {
              item.setTitle('Polo: Move File');
              item.setIcon('hand');
              item.onClick(async () => {
                await this.runPolo([tfile]);
              });
            });
          } else if (tfile instanceof TFolder) {
            menu.addItem(item => {
              item.setTitle('Polo: Move all files in folder');
              item.setIcon('hand');
              item.onClick(async () => {
                const folderToMove = tfile;
                const filesToMove: TFile[] = [];
                for (const file of this.arcana.app.vault.getMarkdownFiles()) {
                  if (file.parent && file.parent.path == folderToMove.path) {
                    filesToMove.push(file);
                  }
                }
                this.runPolo(filesToMove);
              });
            });
          }
        }
      )
    );
  }

  private moveFile(oldPath: string, newFolderPath: string) {
    const oldFile = this.arcana.app.vault.getAbstractFileByPath(
      oldPath
    ) as TFile;
    const newFolder = this.arcana.app.vault.getAbstractFileByPath(
      newFolderPath
    ) as TFolder;
    if (oldFile === null || newFolder === null) {
      new Notice(`Failed to move ${oldFile} to ${newFolder}`);
    }

    const newName = `${newFolder.path}/${oldFile.name}`;
    this.arcana.app.fileManager.renameFile(oldFile, newName);
  }

  private runPolo(files: TFile[]): void {
    new Notice('Asking for new file location suggestions');
    this.requestNewFileLocations(files).then(
      (suggestions: Record<string, TFolder | null>) => {
        new PoloApprovalModal(
          this.arcana.app,
          suggestions,
          this.moveFile.bind(this)
        ).open();
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
    - You will be given a list of file names. 
    - Below is the "File System" section. It shows you the current folder structure of the vault.
    - You must suggest a new folder to move each file to. Your decision should take into consideration:
      - The title, tags, and contents (if provided) of the file.
      - The purpose of the folders in the folder structure (and the files inside each folder if provided).
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
    if (!this.settings.showFilesInFolderStructure) {
      FSTraversalOperators.filterFiles(traversal);
    }
    const fs = FSTraversalOperators.prettyPrint(traversal);

    const context = `
    <Purpose>
    ${purpose}
    <Primary Instructions>
    ${instructions}
    <Additional Instructions>
    ${this.settings.priorInstruction}
    <File System>
    ${fs}
    `;

    return context;
  }

  private async askPolo(files: TFile[]): Promise<string> {
    let details = '';
    for (const file of files) {
      const path = file.path;
      const content = await this.arcana.app.vault.read(file);
      const tags = await new FrontMatterManager(this.arcana).getTags(file);
      details += `
      <New File>
      <Old File Path>
      ${path}
      <Tags>
      ${tags.join(', ')}
      `;
      if (this.settings.showFileContent) {
        details += `
      <File Content>
      ${content}
      `;
      }
      details += `<End of File>`;
    }

    const context = this.getPoloContext();
    console.log(context);
    console.log(details);
    const response = await this.arcana.complete(details, context);
    return response;
  }
}
