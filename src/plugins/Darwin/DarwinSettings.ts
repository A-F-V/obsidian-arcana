import SettingsSection from '@/components/SettingsSection';
import { Setting, Notice } from 'obsidian';

export enum TagStyle {
  None = 'None',
  PascalCase = 'PascalCase',
  CamelCase = 'CamelCase',
  SnakeCase = 'SnakeCase',
  KebabCase = 'KebabCase',
}

export interface DarwinSettings {
  minimum_tag_count_to_present: number;
  only_suggest_existing_tags: boolean;
  exclude_tags: string[];
  max_tags_to_show: number;
  tag_style: TagStyle;
}
export const defaultDarwinSettings: DarwinSettings = {
  minimum_tag_count_to_present: 1,
  only_suggest_existing_tags: false,
  exclude_tags: [],
  max_tags_to_show: 4,
  tag_style: TagStyle.None,
};
export class DarwinSettingsSection extends SettingsSection<DarwinSettings> {
  public sectionTitle = 'Darwin';
  public display(containerEl: HTMLElement): void {
    containerEl.createEl('h1', { text: 'Darwin' });

    new Setting(containerEl)
      .setName('Max tags to add')
      .setDesc('The max tags Darwin should recommend')
      .addText(text => {
        text
          .setPlaceholder('4')
          .setValue(this.settings.max_tags_to_show.toString())
          .onChange(async (value: string) => {
            const limit = parseInt(value);
            if (isNaN(limit)) {
              new Notice(`Darwin: Invalid number ${value} as max tags`);
              return;
            }
            this.settings.max_tags_to_show = limit;
            await this.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Only Existing Tags')
      .setDesc('If enabled, Darwin will only suggest tags that already exist in the vault')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.only_suggest_existing_tags ?? defaultDarwinSettings.only_suggest_existing_tags)
          .onChange(async (value: boolean) => {
            this.settings.only_suggest_existing_tags = value;
            await this.saveSettings();
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
          .setValue(this.settings.exclude_tags?.join(' ') ?? defaultDarwinSettings.exclude_tags.join(' '))
          .onChange(async (value: string) => {
            const prefixes = value.split(' ');
            this.settings.exclude_tags = prefixes;
            await this.saveSettings();
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
          .setValue(this.settings.minimum_tag_count_to_present.toString())
          .onChange(async (value: string) => {
            const limit = parseInt(value);
            if (isNaN(limit)) {
              new Notice(`Darwin: Invalid number ${value} as min tag count to show`);
              return;
            }
            this.settings.minimum_tag_count_to_present = limit;
            await this.saveSettings();
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
          .setValue(this.settings.tag_style)
          .onChange(async (value: string) => {
            // Parse the value as a TagStyle
            const tagStyle = TagStyle[value as keyof typeof TagStyle];
            this.settings.tag_style = tagStyle;
            await this.saveSettings();
          });
      });
  }
}
