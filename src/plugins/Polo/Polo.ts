import {
  Editor,
  MarkdownView,
  Notice,
  TAbstractFile,
  TFile,
  TFolder,
} from 'obsidian';
import ArcanaPluginBase from 'src/components/ArcanaPluginBase';
import {
  FSTraversalOperators,
  FSTraverser,
} from 'src/include/FileSystemCrawler';

import PoloApprovalModal from './PoloApprovalModal';
import FrontMatterManager from 'src/include/FrontMatterManager';
import FileSystemIder from 'src/include/FileSystemIder';
import SettingsSection from '@/components/SettingsSection';
import { PoloSettings, PoloSettingsSection } from './PoloSettings';

export default class PoloPlugin extends ArcanaPluginBase<PoloSettings> {
  public createSettingsSection(): SettingsSection<PoloSettings> {
    return new PoloSettingsSection(
      this.settings,
      this.arcana.getSettingSaver()
    );
  }

  public async onload() {
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
    // ID the files and folders
    const { idToFile, fileToId } = await FileSystemIder.id(
      this.arcana.app.vault
    );
    // Ask Polo for the new file locations
    const response = await this.askPolo(files, fileToId);
    console.log(response);
    // Parse the response
    const fileLocations = this.parsePoloResponse(response, idToFile);
    // Return
    console.log(fileLocations);
    return fileLocations;
  }

  private parsePoloResponse(
    response: string,
    idToFile: Map<number, string>
  ): Record<string, TFolder | null> {
    const lines = response.split('\n');
    const fileLocations: Record<string, TFolder | null> = {};
    for (const line of lines) {
      // Regex to match the following:
      // [File Name] [Folder Path]
      const regex = /(\d*) (\d*)/;
      const matches = line.match(regex);
      if (matches) {
        const oldFileId = Number.parseInt(matches[1]);
        const newFolderId = Number.parseInt(matches[2]);

        const oldFilePath = idToFile.get(oldFileId);
        const newFolderPath = idToFile.get(newFolderId);
        if (oldFilePath === undefined || newFolderPath === undefined) {
          continue;
        }
        const oldFile =
          this.arcana.app.vault.getAbstractFileByPath(oldFilePath);
        const newFolder =
          this.arcana.app.vault.getAbstractFileByPath(newFolderPath);
        if (oldFile === null || newFolderPath === null) {
          // Bad old Path or new Folder
          fileLocations[oldFilePath] = null;
          continue;
        }
        console.debug(`oldFile: ${oldFile.name} newFolder: ${newFolderPath}`);
        fileLocations[oldFilePath] = newFolder as TFolder;
      }
    }
    return fileLocations;
  }

  public async onunload() {}

  private async printFSWithIds(
    filesToId: Map<string, number>
  ): Promise<string> {
    // Get the folder structure
    const traverser = new FSTraverser(this.arcana.app.vault);
    const traversal = traverser.traverse();
    // Only consider .md files and folders.
    if (!this.settings.showFilesInFolderStructure) {
      FSTraversalOperators.filterFiles(traversal);
    }

    const f = (node: TAbstractFile) => {
      const id = filesToId.get(node.path);
      return `${id} ${node.path}`;
    };
    return FSTraversalOperators.prettyPrintCustom(traversal, f);
  }

  private getPoloContext(fs: string): string {
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
    [Old File Path ID] [New Folder ID]\\n
    [Old File Path ID] [New Folder ID]\\n
    ...
    ''
    - The new folder must be an existing path from the File System section
    - The old file path must be exactly the same as the file name given to you
    - Give the id of the file and the id of the folder (not the path). 
    - For example:
    ''
    0 10
    1 13
    2 11
    ''
    `;

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

  private async askPolo(
    files: TFile[],
    fileToId: Map<string, number>
  ): Promise<string> {
    let details = '';

    for (const file of files) {
      const path = file.path;
      const content = await this.arcana.app.vault.read(file);
      const tags = await new FrontMatterManager(this.arcana).getTags(file);
      const id = fileToId.get(path);
      details += `
      <New File>
      <Old File Path>
      ${path}
      <File ID>
      ${id}
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
    const fs = await this.printFSWithIds(fileToId);
    const context = this.getPoloContext(fs);
    console.log(context);
    console.log(details);
    const response = await this.arcana.complete(details, context);
    return response;
  }
}
