import { Notice, TFile } from 'obsidian';
import FrontMatterManager from './FrontMatterManager';
import ArcanaPlugin from 'src/main';
import { assert } from 'console';
import { Mutex } from 'async-mutex';

// fetches and sets ids for notes
// All gets must go through the noteIDer.
export default class NoteIDer {
  private arcana: ArcanaPlugin;
  private frontMatterManager: FrontMatterManager;
  private nextID = -1;
  private mutex = new Mutex();

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
    this.frontMatterManager = new FrontMatterManager(arcana);

    // Periodically check integrrity of IDS
    setInterval(async () => {
      this.checkIntegrity();
    }, 100000);
  }

  private async checkIntegrity() {
    const files = this.arcana.app.vault.getMarkdownFiles();
    const ids = new Set<number>();
    files.map(async file => {
      const id = await this.getNoteID(file);
      if (ids.has(id)) {
        new Notice(`Duplicate id ${id} found in ${file.path}. Resetting id.`);
        await this.clearID(file);
        await this.getNoteID(file);
      }
      ids.add(id);
    });
  }
  async clearID(note: TFile) {
    await this.frontMatterManager.set(note, 'id', null);
  }
  // Will get (and potentially set) a new unique id
  async getNoteID(note: TFile): Promise<number> {
    const fetchedID = await this.tryFetchingNoteID(note);
    // If the note has not been IDed
    if (fetchedID == null) {
      // Give it an id
      const release = await this.mutex.acquire();
      // Mutex it so that we don't have multiple threads trying to dedude the next ID
      await this.setNoteIDToNextAvailable(note);
      release();
      return await this.frontMatterManager.get(note, 'id');
    }
    return fetchedID;
  }

  private async tryFetchingNoteID(note: TFile): Promise<number | null> {
    const id = await this.frontMatterManager.get(note, 'id');
    if (id == null || Number.isNaN(id)) {
      return null;
    }
    return id;
  }

  private async setNoteIDToNextAvailable(note: TFile) {
    if (this.nextID == -1) {
      // We haven't yet done a pass through the vault.
      this.nextID = 1 + (await this.findLargestIDInVault());
    }

    assert(this.nextID != -1);
    // We have the next ID
    this.frontMatterManager.set(note, 'id', this.nextID);
    // We have just consumed the next ID, so incremenet
    this.nextID++;
  }

  private async findLargestIDInVault(): Promise<number> {
    const ids = (await Promise.all(
      this.arcana.app.vault
        .getMarkdownFiles()
        .map(async note => await this.tryFetchingNoteID(note))
        .filter(async id => (await id) != null || Number.isNaN(await id))
    )) as number[];

    const nextLargest = Math.max(...ids, 0);
    return nextLargest;
  }

  async getDocumentWithID(id: number): Promise<TFile | null> {
    // TODO: cache - hard as file renamees will need to be discovered and invalidate cache.

    const files = this.arcana.app.vault.getMarkdownFiles();
    for (const file of files) {
      const fileID = await this.getNoteID(file);
      if (fileID === id) {
        return file;
      }
    }
    return null;
  }
}
