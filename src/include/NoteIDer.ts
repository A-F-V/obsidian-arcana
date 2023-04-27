import { TFile } from 'obsidian';
import FrontMatterManager from './FrontMatterManager';
import ArcanaPlugin from 'src/main';
import { assert } from 'console';

// fetches and sets ids for notes
// All gets must go through the noteIDer.
export default class NoteIDer {
  private arcana: ArcanaPlugin;
  private frontMatterManager: FrontMatterManager;
  private nextID = -1;

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
    this.frontMatterManager = new FrontMatterManager(arcana);
  }

  // Will get (and potentially set) a new unique id
  async getNoteID(note: TFile): Promise<number> {
    let fetchedID = await this.tryFetchingNoteID(note);
    // If the note has not been IDed
    if (fetchedID != null) {
      // Give it an id
      await this.setNoteIDToNextAvailable(note);
      fetchedID = await this.tryFetchingNoteID(note);
    }
    return fetchedID;
  }

  private async tryFetchingNoteID(note: TFile): Promise<number> {
    return await this.frontMatterManager.get(note, 'id');
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
        .filter(async id => (await id) != null)
    )) as number[];

    return Math.max(...ids);
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
