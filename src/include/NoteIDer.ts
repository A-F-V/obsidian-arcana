import { App, TFile } from 'obsidian';
import FrontMatterManager from './FrontMatterManager';

export default class NoteIDer {
  private app: App;
  private nextID: number;

  constructor(app: App) {
    this.app = app;
    this.nextID = 0;
  }

  async idNote(note: TFile): Promise<number> {
    // Check the front matter to see if already has an ID
    let id = this.nextID;

    // Set ID to nextID or return current ID
    await this.app.fileManager.processFrontMatter(note, frontMatter => {
      // Setup Frontmatter
      FrontMatterManager.setupArcanaFrontMatter(frontMatter);
      // Setup ID Section
      if (frontMatter.arcana.id === undefined) {
        frontMatter.arcana.id = this.nextID;
        this.nextID++;
      } else {
        id = frontMatter.arcana.id;
      }
    });
    return id;
  }
}
