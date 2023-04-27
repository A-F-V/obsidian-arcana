import { TFile } from 'obsidian';
import ArcanaPlugin from 'src/main';

export default class FrontMatterManager {
  private arcana: ArcanaPlugin;

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
  }
  // TODO: give type: (Map=>void)
  async processFrontMatter(file: TFile, transformation: any): Promise<void> {
    await this.arcana.app.fileManager.processFrontMatter(file, frontMatter => {
      // Get the current front matter, defaulting to empty if it doesn't exist
      let arcanaFrontMatter = new Map();
      if (frontMatter.arcana !== undefined) {
        arcanaFrontMatter = new Map(frontMatter.arcana.entries());
      }
      // Apply the transformation
      transformation(arcanaFrontMatter);
      // Save the result
      frontMatter.arcana = Object.fromEntries(arcanaFrontMatter.entries());
    });
  }

  async get(file: TFile, key: string): Promise<any | null> {
    let result = null;
    await this.processFrontMatter(file, (arcanaData: any) => {
      result = arcanaData.get(key);
    });
    return result;
  }

  async set(file: TFile, key: string, value: any): Promise<void> {
    await this.processFrontMatter(file, (arcanaData: any) => {
      arcanaData.set(key, value);
    });
  }
}
