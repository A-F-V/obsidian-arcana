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
        arcanaFrontMatter = new Map(Object.entries(frontMatter.arcana));
      }
      // Apply the transformation
      transformation(arcanaFrontMatter);
      // Save the result
      frontMatter.arcana = Object.fromEntries(arcanaFrontMatter.entries());
    });
  }

  async getArcana(file: TFile, key: string): Promise<any | null> {
    let result = null;
    await this.processFrontMatter(file, (arcanaData: any) => {
      result = arcanaData.get(key);
    });
    return result;
  }

  async setArcana(file: TFile, key: string, value: any): Promise<void> {
    await this.processFrontMatter(file, (arcanaData: any) => {
      arcanaData.set(key, value);
    });
  }

  async set(file: TFile, key: string, value: any): Promise<void> {
    await this.arcana.app.fileManager.processFrontMatter(file, frontMatter => {
      frontMatter[key] = value;
    });
  }

  async get<T>(file: TFile, key: string): Promise<T | null> {
    let result: T | null = null;
    await this.arcana.app.fileManager.processFrontMatter(file, frontMatter => {
      result = frontMatter[key];
    });
    return result;
  }

  async getTags(file: TFile): Promise<string[]> {
    const tags = await this.get<string>(file, 'tags');
    if (tags === null || tags === undefined) {
      return [];
    }
    return tags.split(' ');
  }
  async setTags(file: TFile, tags: string[]): Promise<void> {
    await this.set(file, 'tags', tags.join(' '));
  }
}
