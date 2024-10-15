import { FileManager, TFile, parseFrontMatterEntry, parseFrontMatterTags } from 'obsidian';

export default class FrontMatterManager {
  private filemanager: FileManager;

  constructor(filemanager: FileManager) {
    this.filemanager = filemanager;
  }

  async set(file: TFile, key: string, value: number | string | boolean | string[]): Promise<void> {
    await this.filemanager.processFrontMatter(file, frontMatter => {
      console.log(key, frontMatter);
      frontMatter[key] = value;
    });
  }

  async get<T>(file: TFile, key: string): Promise<T | null> {
    let result: T | null = null;

    await this.filemanager
      .processFrontMatter(file, frontMatter => {
        result = parseFrontMatterEntry(frontMatter, key);
      })
      .catch(e => {});

    return result;
  }

  async getTags(file: TFile): Promise<string[]> {
    let tags: string[] | null = null;

    await this.filemanager
      .processFrontMatter(file, frontmatter => {
        tags = parseFrontMatterTags(frontmatter)?.map(tag => tag.replace('#', '')) ?? null;
      })
      .catch(e => {});

    return tags ?? [];
  }
  async setTags(file: TFile, tags: string[]): Promise<void> {
    await this.filemanager.processFrontMatter(file, frontmatter => {
      frontmatter.tags = tags.join(' ');
    });
  }
}
