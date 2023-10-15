import {
  Editor,
  MarkdownView,
  Notice,
  Setting,
  TAbstractFile,
  TFile,
  TFolder,
} from 'obsidian';

import ArcanaPluginBase from 'src/components/ArcanaPluginBase';
import { merge } from 'src/include/Functional';
import FordTemplateSuggestModal from './FordTemplateSuggestModal';
import FrontMatterManager from 'src/include/FrontMatterManager';

type FordSettings = { folder: string };

type MetadataType = 'string' | 'number' | 'boolean' | 'string[]';
type MetadataProperty = { name: string; type: MetadataType; query: string };
type MetadataTemplate = MetadataProperty[];
type PropertyResult = { name: string; type: MetadataType; result: string };
type TemplateResult = PropertyResult[];

const DEFAULT_SETTINGS: FordSettings = { folder: 'FordTemplates' };
export default class FordPlugin extends ArcanaPluginBase {
  private setting: FordSettings = DEFAULT_SETTINGS;

  public async onload() {
    this.setting = merge(
      this.arcana.settings.PluginSettings['Ford'],
      DEFAULT_SETTINGS
    );

    this.arcana.addCommand({
      id: 'ford',
      name: 'Ford Template',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const file = view.file;
        if (!file) {
          return;
        }
        new FordTemplateSuggestModal(
          this.arcana.app,
          this.setting.folder,
          async (templateFile: TFile, evt: MouseEvent | KeyboardEvent) => {
            new Notice('Asking Ford...');
            this.askFord(file, templateFile).catch((error: Error) => {
              new Notice(error.message);
            });
          }
        ).open();
      },
    });

    // So you can apply a template to a file or folder

    this.arcana.registerEvent(
      this.arcana.app.workspace.on(
        'file-menu',
        async (menu, tfile: TAbstractFile) => {
          if (tfile instanceof TFile) {
            menu.addItem(item => {
              item.setTitle('Ford: Apply template to file');
              item.setIcon('layout-template');
              item.onClick(async () => {
                new FordTemplateSuggestModal(
                  this.arcana.app,
                  this.setting.folder,
                  async (
                    templateFile: TFile,
                    evt: MouseEvent | KeyboardEvent
                  ) => {
                    new Notice('Asking Ford...');
                    this.askFord(tfile, templateFile)
                      .catch((error: Error) => {
                        new Notice(error.message);
                      })
                      .then(() => {
                        new Notice(
                          `Done updating ${tfile.basename} with ${templateFile.basename}`
                        );
                      });
                  }
                ).open();
              });
            });
          } else if (tfile instanceof TFolder) {
            menu.addItem(item => {
              item.setTitle('Ford: Apply template to folder');
              item.setIcon('layout-template');
              item.onClick(async () => {
                new FordTemplateSuggestModal(
                  this.arcana.app,
                  this.setting.folder,
                  async (
                    templateFile: TFile,
                    evt: MouseEvent | KeyboardEvent
                  ) => {
                    new Notice('Asking Ford...');
                    for (const file of this.arcana.app.vault.getMarkdownFiles()) {
                      if (file.parent && file.parent.path == tfile.path) {
                        // Need to these synchronously to avoid rate limit
                        // Do a 1 second pause between each
                        await new Promise(resolve => setTimeout(resolve, 100));
                        await this.askFord(file, templateFile)
                          .catch((error: Error) => {
                            new Notice(error.message);
                          })
                          .then(() => {
                            new Notice(
                              `Done updating ${file.basename} with ${templateFile.basename}`
                            );
                          });
                      }
                    }
                  }
                ).open();
              });
            });
          }
        }
      )
    );
  }

  public addSettings(containerEl: HTMLElement) {
    containerEl.createEl('h1', { text: 'Ford' });
    new Setting(containerEl)
      .setName('Ford template folder')
      .setDesc('The folder where the flashcards will be stored')
      .addText(text => {
        text
          .setPlaceholder(DEFAULT_SETTINGS.folder)
          .setValue(this.setting.folder)
          .onChange(async (value: string) => {
            this.setting.folder = value;
            this.arcana.settings.PluginSettings['Ford'] = { folder: value };
            await this.arcana.saveSettings();
          });
      });
  }

  public async onunload() {}

  private async loadTemplate(templateFile: TFile): Promise<MetadataTemplate> {
    // Load the markdown file
    let text = await this.arcana.app.vault.read(templateFile);
    // Split it by sections
    // Find all the headers
    // Skip to the first header
    // Find location of first header
    const firstHeader = text.match(/#+\s*(.*)/gms);
    if (!firstHeader) {
      throw new Error('Could not find first header in template');
    }
    text = text.slice(text.indexOf(firstHeader[0]));
    const headers = text.match(/#+\s*(.*)/g);
    if (!headers) {
      throw new Error('Could not find any headers in the template');
    }
    // The bodies are the text between the header
    const bodies = text.split(/#+\s*.*\n/gm).slice(1);
    if (headers.length !== bodies.length) {
      throw new Error(
        `There are ${headers.length} headers and ${bodies.length} bodies`
      );
    }
    if (bodies.some(body => body.trim().length === 0)) {
      throw new Error('Some of the section bodies are empty');
    }
    // Zip the headers and bodies together
    const template = headers.map((header, index) => {
      // Parse the header
      const headerReg = new RegExp(
        /#+\s*(?<name>[^:\n]*)(:(?<type>(number|string|bool|string\[\])))?$/gm
      );
      const hmatches = headerReg.exec(header);
      if (!hmatches) {
        throw new Error(`Could not parse header ${header}`);
      }
      const groups = hmatches.groups;
      if (!groups) {
        throw new Error(`Could not parse header ${header}`);
      }
      const type = 'type' in groups ? groups.type : 'string';
      const name = groups.name.trim();

      // Parse the body
      const query = bodies[index].trim();
      return { type, name, query };
    }) as MetadataTemplate;
    // Return the template
    return template;
  }

  private async applyTemplateResult(file: TFile, result: TemplateResult) {
    // For each template result apply it to the file
    const fmm = new FrontMatterManager(this.arcana);
    result.map(async (property: PropertyResult) => {
      const { name, type, result } = property;
      if (type === 'string') {
        await fmm.set(file, name, result.replace(/"/g, ''));
      } else if (type === 'string[]') {
        //replace all
        await fmm.set(file, name, result.replace(/"/g, '').split(','));
      } else if (type === 'number') {
        // Check if it is a number
        if (isNaN(Number(result))) {
          throw new Error(`Could not parse ${result} as a number`);
        }
        await fmm.set(file, name, Number(result));
      } else if (type === 'boolean') {
        // Check if it is a boolean
        if (result !== 'true' && result !== 'false') {
          throw new Error(`Could not parse ${result} as a boolean`);
        }
        await fmm.set(file, name, result === 'true');
      }
    });
  }

  private async askFord(file: TFile, templateFile: TFile) {
    const template = await this.loadTemplate(templateFile);
    const fileContent = await this.arcana.app.vault.read(file);
    // Form query for each fields in template
    const getPropertyResult = async (
      propertyName: string,
      propertyType: MetadataType,
      query: string
    ) => {
      const context = `You are an AI that is helping to update metadata in a file. The file is titled '${file.basename}'. The metadata field you are updating is '${propertyName}'. The user wants you to do the following: '${query}'.`;
      const returnType =
        propertyType === 'string[]'
          ? `You need to return a list of strings. This list must be comma seperated and each string must be quoted.`
          : propertyType == 'string'
          ? `You need to return a string. It must not be quoted`
          : propertyType == 'number'
          ? `You need to return a number. It must not be quoted`
          : `You need to return a boolean. So return either 'true' or 'false'.`;

      const fileText = `The file is:\n${fileContent}\n`;
      const question = `${context}\n${returnType}\n${fileText}\n`;

      return await this.arcana.complete(question, context);
    };

    const results = (await Promise.all(
      Object.entries(template).map(async ([index, property]) => {
        const result = await getPropertyResult(
          property.name,
          property.type,
          property.query
        );
        return {
          name: property.name,
          type: property.type,
          result,
        };
      })
    )) as PropertyResult[];

    await this.applyTemplateResult(file, results);
  }
}
