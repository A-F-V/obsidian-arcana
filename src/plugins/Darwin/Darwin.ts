import {
  Editor,
  MarkdownView,
  Notice,
  TAbstractFile,
  TFile,
  TFolder,
} from 'obsidian';
import ArcanaPlugin from 'src/main';
import { removeFrontMatter } from 'src/utilities/DocumentCleaner';

import ArcanaPluginBase from 'src/components/ArcanaPluginBase';
import FrontMatterManager from 'src/include/FrontMatterManager';

export default class DarwinPlugin extends ArcanaPluginBase {
  private arcana: ArcanaPlugin;
  private setting: { folder: string };
  private tagCountCache: [string, number][] | null = null;

  public constructor(arcana: ArcanaPlugin) {
    super();
    this.arcana = arcana;
  }

  // TODO: #44: Setting for max number of tags to show
  private MAX_TAGS_TO_SHOW = 3;

  private async getTagsForFile(file: TFile): Promise<string[]> {
    const fmm = new FrontMatterManager(this.arcana);
    // Get the tags from the front matter
    const tagsFromFrontMatter = await fmm.getTags(file);
    // Get the tags from the contents of the file
    const tagsFromContents = await this.arcana.app.vault
      .read(file)
      .then(contents => {
        // Split on white space
        return contents
          .split(/\s+/)
          .filter(tag => tag[0] === '#' && this.isValidTag(tag.slice(1)))
          .map(tag => tag.slice(1));
      });
    return [...tagsFromFrontMatter, ...tagsFromContents];
  }

  private async getAllTagsInVault() {
    // Tag to count
    const tagMap = new Map<string, number>();

    const tagPromises: Promise<string[]>[] = [];

    for (const file of this.arcana.app.vault.getMarkdownFiles()) {
      // Combine the tags
      tagPromises.push(this.getTagsForFile(file));
    }
    const tags = (await Promise.all(tagPromises)).flat();
    tags.forEach(tag => {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    });

    const tagCount = [...tagMap.entries()];
    // Sort by count
    //tagCount.sort((a, b) => b[1] - a[1]);
    // Sort by tag
    tagCount.sort((a, b) => a[0].localeCompare(b[0]));
    this.tagCountCache = tagCount;
  }

  private isValidTag(tag: string): boolean {
    /*
    You can use any of the following characters in your tags:

    Alphabetical letters
    Numbers
    Underscore (_)
    Hyphen (-)
    Forward slash (/) for Nested tags

    Tags must contain at least one non-numerical character. For example, #1984 isn't a valid tag, but #y1984 is.

    Tags can't contain blank spaces
    */

    // Check if tag is empty
    if (tag.length === 0) return false;
    // Check if tag has a non-numerical character
    if (!/[a-zA-Z_\-\/]/.test(tag)) return false;
    // Check if tag has a space
    if (/\s/.test(tag)) return false;
    // Check if the tag has only valid characters
    if (!/^[a-zA-Z0-9_\-\/]+$/.test(tag)) return false;
    return true;
  }

  private getAdditionalTagsFromResponse(
    response: string,
    tagsFromFile: string[]
  ): string[] {
    const removeHash = (tag: string) => tag.replace('#', '');

    const tags = response
      .split(' ')
      .map(tag => tag.trim())
      .map(removeHash)
      .filter(tag => tag.length > 0)
      .filter(tag => this.isValidTag(tag))
      .filter(tag => !tagsFromFile.includes(tag))
      .filter(tag => this.tagCountCache?.map(t => t[0]).includes(tag));
    const uniqueTags = [...new Set(tags)];
    if (uniqueTags.length === 0) return [];
    if (uniqueTags.length > this.MAX_TAGS_TO_SHOW) return [];
    return uniqueTags;
  }

  private async fileHasTags(file: TFile): Promise<boolean> {
    const fmm = new FrontMatterManager(this.arcana);
    const tags = await fmm.getTags(file);
    return tags.length > 0;
  }

  public async onload() {
    // Get lits of all tags periodically
    await this.getAllTagsInVault();
    this.arcana.registerInterval(
      window.setInterval(async () => {
        await this.getAllTagsInVault();
      }, 1000 * 10)
    );

    this.arcana.addCommand({
      id: 'darwin',
      name: 'Darwin Tag',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const file = view.file;
        await this.autoTagFile(file);
      },
    });

    this.arcana.registerEvent(
      this.arcana.app.workspace.on(
        'file-menu',
        async (menu, tfile: TAbstractFile) => {
          if (tfile instanceof TFile) {
            menu.addItem(item => {
              item.setTitle('Darwin: Tag File');
              item.setIcon('tag');
              item.onClick(async () => {
                await this.autoTagFile(tfile);
              });
            });
          } else if (tfile instanceof TFolder) {
            menu.addItem(item => {
              item.setTitle('Darwin: Tag all untagged files in folder');
              item.setIcon('tag');
              item.onClick(async () => {
                const folderToTag = tfile;
                for (const file of this.arcana.app.vault.getMarkdownFiles()) {
                  if (file.parent && file.parent.path == folderToTag.path) {
                    // Need to these synchronously to avoid rate limit
                    if (await this.fileHasTags(file)) continue;
                    await this.autoTagFile(file);
                  }
                }
              });
            });
          }
        }
      )
    );
  }

  public async onunload() {}

  private async autoTagFile(file: TFile) {
    const fmm = new FrontMatterManager(this.arcana);
    const tagsInFrontMatter = await fmm.getTags(file);

    const tagsToAdd = await this.askDarwin(file);
    if (tagsToAdd.length === 0) {
      new Notice('Darwin: Failed to get a good list of tags added');
      return;
    }

    await fmm.setTags(file, tagsInFrontMatter.concat(tagsToAdd));
  }

  // TODO: #45: Setting to specify the style explictly

  private async askDarwin(file: TFile): Promise<string[]> {
    const purpose = `You are an AI designed to select additional tags to add to a given file. You select from handful of EXISTING TAGS that you will suggest should be added.`;

    const existing_tags = `${this.tagCountCache
      ?.map(([tag, count]) => `${tag}`)
      .join(' ')}`;

    const tag_format = `Tags must use the only the following characters: Alphabetical letters, Numbers, Underscore (_), Hyphen (-), Forward slash (/) for Nested tags. Tags cannot contain blank spaces. Tags must contain at least one non-numerical character. For example, #1984 isn't a valid tag, but #y1984 is.`;

    const tag_style = `Availabe tagging styles: camelCase, lower kebab-case, snake_case, PascalCase.`; //If the existing tags have a common style, use that as the style of your tags.`;

    const rules = `1. Return a list of additional tags to add that are most relevant to the file. The list should be space seperated. For example: 'tag1 tag2 tag3'.
    2. You should only return the list of additional tags and nothing else. Do not give any preamble or other text.
    3. The length of the list of additional tags must be less than or equal to ${this.MAX_TAGS_TO_SHOW}.
    4. The list of additional tags must not contain any tags that are already present in the file.
    5. Tags should be in the same style as the EXISTING TAGS.
    6. Tags must be be valid according to the tag format.
    7. Only suggest tags that are in the EXISTING TAGS list.`;

    const context = `
    [Purpose]
    ${purpose}.
    [EXISTING TAGS]
    ${existing_tags}
    [Tag format]
    ${tag_format}
    [Tagging Style]
    ${tag_style} 
    [Rules]
    ${rules}
    `;

    const title = file.basename;
    // Get the document text from the file
    const documentText = await this.arcana.app.vault.read(file);
    // Remove the front matter
    const cleanedText = removeFrontMatter(documentText);
    // Get the tags in the file:
    const tagsInFile = await this.getTagsForFile(file);
    let details = `Title of file: ${title}\n\nText in file: ${cleanedText}\n\n`;
    if (tagsInFile.length > 0)
      details += `Tags present in file: ${tagsInFile.join(' ')}`;

    const response = await this.arcana.complete(details, context);

    return this.getAdditionalTagsFromResponse(response, tagsInFile);
  }
}
