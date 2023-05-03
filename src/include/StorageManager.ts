import { assert } from 'console';
import { FileSystemAdapter, normalizePath } from 'obsidian';
import ArcanaPlugin from 'src/main';

// This is for arcana only storage.
// Use the regular obsidian facilities for anything else
// Everything is done relative to the storagePath.
export default class StorageManager {
  private readonly storagePath = normalizePath('.arcana');
  private fs: FileSystemAdapter;
  private setup = false;

  constructor(arcana: ArcanaPlugin) {
    this.fs = arcana.app.vault.adapter as FileSystemAdapter;
  }

  async setupStorage() {
    // Ensure the arcana storage exists
    await this.ensureFolderExists(this.storagePath);
    this.setup = true;
  }
  private async ensureFolderExists(folder: string) {
    // Create the storage path if it does not exist
    await this.fs.exists(folder).then((exists: boolean) => {
      if (!exists) {
        this.fs.mkdir(folder);
      }
    });
  }

  getPath(path: string): string {
    assert(
      this.setup,
      'It is illegal to get file paths when the storage folder has not been setup'
    );
    return this.fs.getBasePath() + '/' + this.storagePath + '/' + path;
  }
}
