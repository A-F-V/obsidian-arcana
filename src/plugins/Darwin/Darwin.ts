import { Editor, MarkdownView, Notice, TAbstractFile, TFile, TFolder } from 'obsidian';
import { removeFrontMatter } from 'src/utilities/DocumentCleaner';

import ArcanaPluginBase from 'src/components/ArcanaPluginBase';
import FrontMatterManager from 'src/include/FrontMatterManager';
import SettingsSection from '@/components/SettingsSection';
import { DarwinSettings, DarwinSettingsSection, TagStyle } from './DarwinSettings';

export default class DarwinPlugin extends ArcanaPluginBase<DarwinSettings> {
  public createSettingsSection(): SettingsSection<DarwinSettings> {
    return new DarwinSettingsSection(this.settings, this.saveSettings);
  }

  private tagCountCache: [string, number][] | null = null;

  private async getTagsForFile(file: TFile): Promise<string[]> {
    const fmm = new FrontMatterManager(this.app.fileManager);
    // Get the tags from the front matter
    const tagsFromFrontMatter = await fmm.getTags(file);
    // Get the tags from the contents of the file
    const tagsFromContents = await this.app.vault.read(file).then(contents => {
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

    for (const file of this.app.vault.getMarkdownFiles()) {
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
    if (!/[a-zA-Z_\-/]/.test(tag)) return false;
    // Check if tag has a space
    if (/\s/.test(tag)) return false;
    // Check if the tag has only valid characters
    if (!/^[a-zA-Z0-9_\-/]+$/.test(tag)) return false;
    return true;
  }

  private enforceTagStyle(tag: string): string {
    switch (this.settings.tag_style) {
      case TagStyle.None:
        return tag;
      case TagStyle.PascalCase:
        return tag
          .split(/[-_/]/)
          .map(word => word[0].toUpperCase() + word.slice(1))
          .join('');
      case TagStyle.CamelCase:
        return tag
          .split(/[-_/]/)
          .map((word, index) =>
            index === 0 ? word[0].toLowerCase() + word.slice(1) : word[0].toUpperCase() + word.slice(1)
          )
          .join('');
      case TagStyle.SnakeCase:
        return tag.toLowerCase().replace(/[-_/]/g, '_');
      case TagStyle.KebabCase:
        return tag.toLowerCase().replace(/[-_/]/g, '-');
    }
  }

  private getAllSuggestableVaultTags(): string[] {
    return (
      this.tagCountCache
        // Filter out tags that don't meet the minimum count
        ?.filter(([tag, count]) => count >= this.settings.minimum_tag_count_to_present)
        .map(t => t[0])
        // Ignore all vault tags that match exclude_tags
        .filter(vaultTag => {
          return !this.settings.exclude_tags.some(exTag => {
            const regex = new RegExp(
              exTag
                // replace all wild cards with regex wild cards
                .replace(/\*/g, '.*')
                // Add a ^ and $ to the regex to make sure it matches the whole string
                .replace(/^(.*)$/, '^$1$')
            );
            return regex.test(vaultTag);
          });
        }) ?? []
    );
  }

  // Robust function to get tags from response
  private getAdditionalTagsFromResponse(response: string, tagsFromFile: string[]): string[] {
    // If the response has a colon in it, split and take the second half
    if (response.includes(':')) {
      response = response.split(':')[1];
    }

    const tags = response
      .replace(/#|,/g, '')
      .split(' ')
      .map(tag => {
        return tag.trim();
      })
      .filter(tag => tag.length > 0)
      .filter(tag => this.isValidTag(tag))
      .filter(tag => !tagsFromFile.includes(tag))
      .filter(tag => {
        if (this.settings.only_suggest_existing_tags)
          return (
            this.getAllSuggestableVaultTags()
              // Only suggest from the tags that remain
              .includes(tag)
          );
        else return true;
      })
      .map(tag => {
        if (this.settings.only_suggest_existing_tags) return tag;
        else return this.enforceTagStyle(tag);
      });

    const uniqueTags = [...new Set(tags)];
    return uniqueTags.slice(0, this.settings.max_tags_to_show);
  }

  private async fileHasTags(file: TFile): Promise<boolean> {
    const fmm = new FrontMatterManager(this.app.fileManager);
    const tags = await fmm.getTags(file);
    return tags.length > 0;
  }

  public async onload() {
    // Get lists of all tags periodically
    // TODO: Just add tags heuristicly after initial load
    this.plugin.registerInterval(
      window.setInterval(async () => {
        await this.getAllTagsInVault();
      }, 1000 * 60)
    );

    this.getAllTagsInVault().then(() => {
      this.plugin.addCommand({
        id: 'darwin',
        name: 'Darwin Tag',
        editorCallback: async (editor: Editor, view: MarkdownView) => {
          const file = view.file;
          if (!file) {
            new Notice('Darwin: No file selected');
            return;
          }
          await this.autoTagFile(file);
        },
      });

      this.plugin.registerEvent(
        this.app.workspace.on('file-menu', async (menu, tfile: TAbstractFile) => {
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
                for (const file of this.app.vault.getMarkdownFiles()) {
                  if (file.parent && file.parent.path == folderToTag.path) {
                    // Need to these synchronously to avoid rate limit
                    if (await this.fileHasTags(file)) continue;
                    await this.autoTagFile(file);
                  }
                }
              });
            });
          }
        })
      );
    });
  }

  public async onunload() {}

  private async autoTagFile(file: TFile) {
    const fmm = new FrontMatterManager(this.app.fileManager);
    const tagsInFrontMatter = await fmm.getTags(file);

    const complexResponse = await this.askDarwin(file);
    const tagsToAdd = this.getAdditionalTagsFromResponse(complexResponse, tagsInFrontMatter);

    if (tagsToAdd.length == 0) {
      new Notice(`Darwin: Failed to get a good list of tags added: Got ${tagsToAdd}`);
      return;
    }
    console.log(`Darwin: Adding tags ${tagsToAdd} to file ${file.path}`);
    await fmm.setTags(file, tagsInFrontMatter.concat(tagsToAdd));
  }

  private DarwinComplexContext(): string {
    let purpose = `You are an AI designed to select additional tags to add to a given file.`;
    if (this.settings.only_suggest_existing_tags)
      purpose += `You select from handful of EXISTING TAGS that you will suggest should be added.`;

    const tag_format = `Tags must use the only the following characters: Alphabetical letters, Numbers, Underscore (_), Hyphen (-), Forward slash (/) for Nested tags. Tags cannot contain blank spaces. Tags must contain at least one non-numerical character. For example, #1984 isn't a valid tag, but #y1984 is.`;

    let rules = `- Return a list of additional tags to add that are most relevant to the file. The list should be space seperated. For example: 'tag1 tag2 tag3'.
    - You should only return the list of additional tags and nothing else. Do not give any preamble or other text.
    - The length of the list of additional tags must be less than or equal to ${this.settings.max_tags_to_show}.
    - The list of additional tags must not contain any tags that are already present in the file.
    - Tags must be be valid according to the tag format.`;

    if (this.settings.only_suggest_existing_tags) rules += `\n- Only suggest tags that are in the EXISTING TAGS list.`;

    let context = `
    [Purpose]
    ${purpose}.
    [Tag format]
    ${tag_format}
    [Rules]
    ${rules}
    `;

    if (this.settings.only_suggest_existing_tags) {
      context += `\n[EXISTING TAGS]\n${this.getAllSuggestableVaultTags().join(' ')}`;
    }
    return context;
  }

  private async askDarwin(file: TFile): Promise<string> {
    const title = file.basename;
    // Get the document text from the file
    const documentText = await this.app.vault.read(file);
    // Remove the front matter
    const cleanedText = removeFrontMatter(documentText);
    // Get the tags in the file:
    const tagsInFile = await this.getTagsForFile(file);

    let details = `
    [Title] 
    ${title}
    `;

    if (tagsInFile.length > 0) {
      details += `[Tags Present In File]
    ${tagsInFile.join(' ')}
    `;
    }

    details += `
    [Text]
    ${cleanedText}
    `;

    const context = this.DarwinComplexContext();
    const response = await this.agent.complete(details, context);
    return response;
  }
}
