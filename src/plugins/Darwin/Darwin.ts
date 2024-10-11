import {
  Editor,
  MarkdownView,
  Notice,
  Setting,
  TAbstractFile,
  TFile,
  TFolder,
} from 'obsidian';
import { removeFrontMatter } from 'src/utilities/DocumentCleaner';

import ArcanaPluginBase from 'src/components/ArcanaPluginBase';
import FrontMatterManager from 'src/include/FrontMatterManager';
import { merge } from 'src/include/Functional';

enum TagStyle {
  None = 'None',
  PascalCase = 'PascalCase',
  CamelCase = 'CamelCase',
  SnakeCase = 'SnakeCase',
  KebabCase = 'KebabCase',
}

type DarwinSettings = {
  minimum_tag_count_to_present: number;
  only_suggest_existing_tags: boolean;
  exclude_tags: string[];
  max_tags_to_show: number;
  tag_style: TagStyle;
};

const DEFAULT_SETTINGS: DarwinSettings = {
  minimum_tag_count_to_present: 1,
  only_suggest_existing_tags: false,
  exclude_tags: [],
  max_tags_to_show: 4,
  tag_style: TagStyle.None,
};
export default class DarwinPlugin extends ArcanaPluginBase {
  private setting: DarwinSettings = DEFAULT_SETTINGS;
  private tagCountCache: [string, number][] | null = null;

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
    if (!/[a-zA-Z_\-/]/.test(tag)) return false;
    // Check if tag has a space
    if (/\s/.test(tag)) return false;
    // Check if the tag has only valid characters
    if (!/^[a-zA-Z0-9_\-/]+$/.test(tag)) return false;
    return true;
  }

  private enforceTagStyle(tag: string): string {
    switch (this.setting.tag_style) {
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
            index === 0
              ? word[0].toLowerCase() + word.slice(1)
              : word[0].toUpperCase() + word.slice(1)
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
        ?.filter(
          ([tag, count]) => count >= this.setting.minimum_tag_count_to_present
        )
        .map(t => t[0])
        // Ignore all vault tags that match exclude_tags
        .filter(vaultTag => {
          return !this.setting.exclude_tags.some(exTag => {
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
  private getAdditionalTagsFromResponse(
    response: string,
    tagsFromFile: string[]
  ): string[] {
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
        if (this.setting.only_suggest_existing_tags)
          return (
            this.getAllSuggestableVaultTags()
              // Only suggest from the tags that remain
              .includes(tag)
          );
        else return true;
      })
      .map(tag => {
        if (this.setting.only_suggest_existing_tags) return tag;
        else return this.enforceTagStyle(tag);
      });

    const uniqueTags = [...new Set(tags)];
    return uniqueTags.slice(0, this.setting.max_tags_to_show);
  }

  private async fileHasTags(file: TFile): Promise<boolean> {
    const fmm = new FrontMatterManager(this.arcana);
    const tags = await fmm.getTags(file);
    return tags.length > 0;
  }

  public async onload() {
    this.setting = merge(
      this.arcana.settings.PluginSettings['Darwin'],
      DEFAULT_SETTINGS
    );

    // Get lists of all tags periodically
    // TODO: Just add tags heuristicly after initial load
    this.arcana.registerInterval(
      window.setInterval(async () => {
        await this.getAllTagsInVault();
      }, 1000 * 60)
    );

    await this.getAllTagsInVault().then(() => {
      this.arcana.addCommand({
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
    });
  }

  public addSettings(containerEl: HTMLElement) {
    containerEl.createEl('h1', { text: 'Darwin' });

    new Setting(containerEl)
      .setName('Max tags to add')
      .setDesc('The max tags Darwin should recommend')
      .addText(text => {
        text
          .setPlaceholder('4')
          .setValue(this.setting.max_tags_to_show.toString())
          .onChange(async (value: string) => {
            const limit = parseInt(value);
            if (isNaN(limit)) {
              new Notice(`Darwin: Invalid number ${value} as max tags`);
              return;
            }
            this.setting.max_tags_to_show = limit;
            this.arcana.settings.PluginSettings['Darwin'] = this.setting;
            await this.arcana.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Only Existing Tags')
      .setDesc(
        'If enabled, Darwin will only suggest tags that already exist in the vault'
      )
      .addToggle(toggle => {
        toggle
          .setValue(
            this.setting.only_suggest_existing_tags ??
              DEFAULT_SETTINGS.only_suggest_existing_tags
          )
          .onChange(async (value: boolean) => {
            this.setting.only_suggest_existing_tags = value;
            this.arcana.settings.PluginSettings['Darwin'] = this.setting;
            await this.arcana.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Exclude Tags')
      .setDesc(
        "If 'Only Existing Tags' is enabled, Darwin will not choose from vault tags that match these tag families. Wild cards are supported. Otherwise tags match exactly to be excluded."
      )
      .addText(text => {
        text
          .setPlaceholder('tag tag-family/*')
          .setValue(
            this.setting.exclude_tags?.join(' ') ??
              DEFAULT_SETTINGS.exclude_tags.join(' ')
          )
          .onChange(async (value: string) => {
            const prefixes = value.split(' ');
            this.setting.exclude_tags = prefixes;
            this.arcana.settings.PluginSettings['Darwin'] = this.setting;
            await this.arcana.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Min tag count to show to Darwin')
      .setDesc(
        'The minimum number of times a tag must appear in the vault to be shown to Darwin. Darwin does better with fewer tags to choose from.'
      )
      .addText(text => {
        text
          .setPlaceholder('1')
          .setValue(this.setting.minimum_tag_count_to_present.toString())
          .onChange(async (value: string) => {
            const limit = parseInt(value);
            if (isNaN(limit)) {
              new Notice(
                `Darwin: Invalid number ${value} as min tag count to show`
              );
              return;
            }
            this.setting.minimum_tag_count_to_present = limit;
            this.arcana.settings.PluginSettings['Darwin'] = this.setting;
            await this.arcana.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('New Tag Style')
      .setDesc('The style of new tags that Darwin will suggest')
      .addDropdown(dropdown => {
        dropdown
          .addOption('None', 'None')
          .addOption('KebabCase', 'kebab-case')
          .addOption('SnakeCase', 'snake_case')
          .addOption('CamelCase', 'camelCase')
          .addOption('PascalCase', 'PascalCase')
          .setValue(this.setting.tag_style)
          .onChange(async (value: string) => {
            // Parse the value as a TagStyle
            const tagStyle = TagStyle[value as keyof typeof TagStyle];
            this.setting.tag_style = tagStyle;
            this.arcana.settings.PluginSettings['Darwin'] = this.setting;
            await this.arcana.saveSettings();
            console.log(this.setting);
          });
      });
  }

  public async onunload() {}

  private async autoTagFile(file: TFile) {
    const fmm = new FrontMatterManager(this.arcana);
    const tagsInFrontMatter = await fmm.getTags(file);

    const complexResponse = await this.askDarwin(file);
    const tagsToAdd = this.getAdditionalTagsFromResponse(
      complexResponse,
      tagsInFrontMatter
    );

    if (tagsToAdd.length == 0) {
      new Notice(
        `Darwin: Failed to get a good list of tags added: Got ${tagsToAdd}`
      );
      return;
    }
    console.log(`Darwin: Adding tags ${tagsToAdd} to file ${file.path}`);
    await fmm.setTags(file, tagsInFrontMatter.concat(tagsToAdd));
  }

  private DarwinComplexContext(): string {
    let purpose = `You are an AI designed to select additional tags to add to a given file.`;
    if (this.setting.only_suggest_existing_tags)
      purpose += `You select from handful of EXISTING TAGS that you will suggest should be added.`;

    const tag_format = `Tags must use the only the following characters: Alphabetical letters, Numbers, Underscore (_), Hyphen (-), Forward slash (/) for Nested tags. Tags cannot contain blank spaces. Tags must contain at least one non-numerical character. For example, #1984 isn't a valid tag, but #y1984 is.`;

    let rules = `- Return a list of additional tags to add that are most relevant to the file. The list should be space seperated. For example: 'tag1 tag2 tag3'.
    - You should only return the list of additional tags and nothing else. Do not give any preamble or other text.
    - The length of the list of additional tags must be less than or equal to ${this.setting.max_tags_to_show}.
    - The list of additional tags must not contain any tags that are already present in the file.
    - Tags must be be valid according to the tag format.`;

    if (this.setting.only_suggest_existing_tags)
      rules += `\n- Only suggest tags that are in the EXISTING TAGS list.`;

    let context = `
    [Purpose]
    ${purpose}.
    [Tag format]
    ${tag_format}
    [Rules]
    ${rules}
    `;

    if (this.setting.only_suggest_existing_tags) {
      context += `\n[EXISTING TAGS]\n${this.getAllSuggestableVaultTags().join(
        ' '
      )}`;
    }
    return context;
  }

  private async askDarwin(file: TFile): Promise<string> {
    const title = file.basename;
    // Get the document text from the file
    const documentText = await this.arcana.app.vault.read(file);
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
    const response = await this.arcana.complete(details, context);
    return response;
  }
}
