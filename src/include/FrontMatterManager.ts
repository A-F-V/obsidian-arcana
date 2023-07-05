import { TFile, parseFrontMatterEntry, parseFrontMatterTags } from 'obsidian';
import ArcanaPlugin from 'src/main';

export default class FrontMatterManager {
  private arcana: ArcanaPlugin;

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
  }

  async set(file: TFile, key: string, value: any): Promise<void> {
    await this.arcana.app.fileManager.processFrontMatter(file, frontMatter => {
      frontMatter[key] = value;
    });
  }

  async get<T>(file: TFile, key: string): Promise<T | null> {
    let result: T | null = null;

    await this.arcana.app.fileManager
      .processFrontMatter(file, frontMatter => {
        result = parseFrontMatterEntry(frontMatter, key);
      })
      .catch(e => {});

    return result;
  }

  async getTags(file: TFile): Promise<string[]> {
    let tags: string[] | null = null;

    await this.arcana.app.fileManager
      .processFrontMatter(file, frontmatter => {
        tags = parseFrontMatterTags(frontmatter);
      })
      .catch(e => {});

    return tags ?? [];
  }
  async setTags(file: TFile, tags: string[]): Promise<void> {
    await this.arcana.app.fileManager.processFrontMatter(file, frontmatter => {
      frontmatter.tags = tags.join(' ');
    });
  }
}
