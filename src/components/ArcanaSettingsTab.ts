import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import ArcanaPlugin from '../main';
import { AvailableModels } from 'src/include/ArcanaSettings';

export default class ArcanaSettingsTab extends PluginSettingTab {
  plugin: ArcanaPlugin;

  constructor(app: App, plugin: ArcanaPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h1', { text: 'Arcana' });

    /*
      TODO: Not working as invokes the current model which may not be the provider's model
    const addTestKeyButton = (setting: Setting) => {
      setting.addButton(button => {
        button.setButtonText('Test Key').onClick(() => {
          this.plugin
            .complete('Ping (you say "Pong")')
            .then((result: string) => {
              if (result === 'Pong') {
                new Notice('Key is valid');
              } else {
                new Notice('Key is valid but API is not responding correctly');
              }
            }); // The catch case is handled by the complete failing
        });
      });
    };
    */

    new Setting(containerEl)
      .setName('OpenAI API key')
      .setDesc('Your OpenAI API key')
      .addText(text =>
        text
          .setPlaceholder('OpenAI API Key')
          .setValue(this.plugin.settings.OPEN_AI_API_KEY)
          .onChange(async value => {
            this.plugin.settings.OPEN_AI_API_KEY = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Anthropic API key')
      .setDesc('Your Anthropic API key')
      .addText(text =>
        text
          .setPlaceholder('Anthropic API Key')
          .setValue(this.plugin.settings.ANTHROPIC_API_KEY)
          .onChange(async value => {
            this.plugin.settings.ANTHROPIC_API_KEY = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Model type')
      .setDesc('The model to use for generating text')
      .addDropdown(dropdown => {
        dropdown
          .addOption('gpt-3.5-turbo', 'GPT3.5')
          .addOption('gpt-4-turbo', 'GPT4')
          .addOption('gpt-4o', 'GPT4o')
          .addOption('claude-3-5-sonnet-20240620', 'Claude 3.5 Sonnet')
          .setValue(this.plugin.settings.MODEL_TYPE)
          .onChange(async value => {
            this.plugin.settings.MODEL_TYPE = value as AvailableModels;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Text to Speech Language')
      .setDesc("The language used in AI's speech recognition")
      .addDropdown(dropdown => {
        dropdown
          .addOption('en', 'english')
          .addOption('zh', 'chinese')
          .addOption('de', 'german')
          .addOption('es', 'spanish')
          .addOption('ru', 'russian')
          .addOption('ko', 'korean')
          .addOption('fr', 'french')
          .addOption('ja', 'japanese')
          .addOption('pt', 'portuguese')
          .addOption('tr', 'turkish')
          .addOption('pl', 'polish')
          .addOption('ca', 'catalan')
          .addOption('nl', 'dutch')
          .addOption('ar', 'arabic')
          .addOption('sv', 'swedish')
          .addOption('it', 'italian')
          .addOption('id', 'indonesian')
          .addOption('hi', 'hindi')
          .addOption('fi', 'finnish')
          .addOption('vi', 'vietnamese')
          .addOption('he', 'hebrew')
          .addOption('uk', 'ukrainian')
          .addOption('el', 'greek')
          .addOption('ms', 'malay')
          .addOption('cs', 'czech')
          .addOption('ro', 'romanian')
          .addOption('da', 'danish')
          .addOption('hu', 'hungarian')
          .addOption('ta', 'tamil')
          .addOption('no', 'norwegian')
          .addOption('th', 'thai')
          .addOption('ur', 'urdu')
          .addOption('hr', 'croatian')
          .addOption('bg', 'bulgarian')
          .addOption('lt', 'lithuanian')
          .addOption('la', 'latin')
          .addOption('mi', 'maori')
          .addOption('ml', 'malayalam')
          .addOption('cy', 'welsh')
          .addOption('sk', 'slovak')
          .addOption('te', 'telugu')
          .addOption('fa', 'persian')
          .addOption('lv', 'latvian')
          .addOption('bn', 'bengali')
          .addOption('sr', 'serbian')
          .addOption('az', 'azerbaijani')
          .addOption('sl', 'slovenian')
          .addOption('kn', 'kannada')
          .addOption('et', 'estonian')
          .addOption('mk', 'macedonian')
          .addOption('br', 'breton')
          .addOption('eu', 'basque')
          .addOption('is', 'icelandic')
          .addOption('hy', 'armenian')
          .addOption('ne', 'nepali')
          .addOption('mn', 'mongolian')
          .addOption('bs', 'bosnian')
          .addOption('kk', 'kazakh')
          .addOption('sq', 'albanian')
          .addOption('sw', 'swahili')
          .addOption('gl', 'galician')
          .addOption('mr', 'marathi')
          .addOption('pa', 'punjabi')
          .addOption('si', 'sinhala')
          .addOption('km', 'khmer')
          .addOption('sn', 'shona')
          .addOption('yo', 'yoruba')
          .addOption('so', 'somali')
          .addOption('af', 'afrikaans')
          .addOption('oc', 'occitan')
          .addOption('ka', 'georgian')
          .addOption('be', 'belarusian')
          .addOption('tg', 'tajik')
          .addOption('sd', 'sindhi')
          .addOption('gu', 'gujarati')
          .addOption('am', 'amharic')
          .addOption('yi', 'yiddish')
          .addOption('lo', 'lao')
          .addOption('uz', 'uzbek')
          .addOption('fo', 'faroese')
          .addOption('ht', 'haitian creole')
          .addOption('ps', 'pashto')
          .addOption('tk', 'turkmen')
          .addOption('nn', 'nynorsk')
          .addOption('mt', 'maltese')
          .addOption('sa', 'sanskrit')
          .addOption('lb', 'luxembourgish')
          .addOption('my', 'myanmar')
          .addOption('bo', 'tibetan')
          .addOption('tl', 'tagalog')
          .addOption('mg', 'malagasy')
          .addOption('as', 'assamese')
          .addOption('tt', 'tatar')
          .addOption('ha', 'hawaiian')
          .addOption('ln', 'lingala')
          .addOption('ha', 'hausa')
          .addOption('ba', 'bashkir')
          .addOption('jw', 'javanese')
          .addOption('su', 'sundanese')
          .addOption('yu', 'cantonese')
          .addOption('en', 'english')
          .addOption('zh', 'chinese')
          .addOption('de', 'german')
          .addOption('es', 'spanish')
          .addOption('ru', 'russian')
          .addOption('ko', 'korean')
          .addOption('fr', 'french')
          .addOption('ja', 'japanese')
          .addOption('pt', 'portuguese')
          .addOption('tr', 'turkish')
          .addOption('pl', 'polish')
          .addOption('ca', 'catalan')
          .addOption('nl', 'dutch')
          .addOption('ar', 'arabic')
          .addOption('sv', 'swedish')
          .addOption('it', 'italian')
          .addOption('id', 'indonesian')
          .addOption('hi', 'hindi')
          .addOption('fi', 'finnish')
          .addOption('vi', 'vietnamese')
          .addOption('he', 'hebrew')
          .addOption('uk', 'ukrainian')
          .addOption('el', 'greek')
          .addOption('ms', 'malay')
          .addOption('cs', 'czech')
          .addOption('ro', 'romanian')
          .addOption('da', 'danish')
          .addOption('hu', 'hungarian')
          .addOption('ta', 'tamil')
          .addOption('no', 'norwegian')
          .addOption('th', 'thai')
          .addOption('ur', 'urdu')
          .addOption('hr', 'croatian')
          .addOption('bg', 'bulgarian')
          .addOption('lt', 'lithuanian')
          .addOption('la', 'latin')
          .addOption('mi', 'maori')
          .addOption('ml', 'malayalam')
          .addOption('cy', 'welsh')
          .addOption('sk', 'slovak')
          .addOption('te', 'telugu')
          .addOption('fa', 'persian')
          .addOption('lv', 'latvian')
          .addOption('bn', 'bengali')
          .addOption('sr', 'serbian')
          .addOption('az', 'azerbaijani')
          .addOption('sl', 'slovenian')
          .addOption('kn', 'kannada')
          .addOption('et', 'estonian')
          .addOption('mk', 'macedonian')
          .addOption('br', 'breton')
          .addOption('eu', 'basque')
          .addOption('is', 'icelandic')
          .addOption('hy', 'armenian')
          .addOption('ne', 'nepali')
          .addOption('mn', 'mongolian')
          .addOption('bs', 'bosnian')
          .addOption('kk', 'kazakh')
          .addOption('sq', 'albanian')
          .addOption('sw', 'swahili')
          .addOption('gl', 'galician')
          .addOption('mr', 'marathi')
          .addOption('pa', 'punjabi')
          .addOption('si', 'sinhala')
          .addOption('km', 'khmer')
          .addOption('sn', 'shona')
          .addOption('yo', 'yoruba')
          .addOption('so', 'somali')
          .addOption('af', 'afrikaans')
          .addOption('oc', 'occitan')
          .addOption('ka', 'georgian')
          .addOption('be', 'belarusian')
          .addOption('tg', 'tajik')
          .addOption('sd', 'sindhi')
          .addOption('gu', 'gujarati')
          .addOption('am', 'amharic')
          .addOption('yi', 'yiddish')
          .addOption('lo', 'lao')
          .addOption('uz', 'uzbek')
          .addOption('fo', 'faroese')
          .addOption('ht', 'haitian creole')
          .addOption('ps', 'pashto')
          .addOption('tk', 'turkmen')
          .addOption('nn', 'nynorsk')
          .addOption('mt', 'maltese')
          .addOption('sa', 'sanskrit')
          .addOption('lb', 'luxembourgish')
          .addOption('my', 'myanmar')
          .addOption('bo', 'tibetan')
          .addOption('tl', 'tagalog')
          .addOption('mg', 'malagasy')
          .addOption('as', 'assamese')
          .addOption('tt', 'tatar')
          .addOption('haw', 'hawaiian')
          .addOption('ln', 'lingala')
          .addOption('ha', 'hausa')
          .addOption('ba', 'bashkir')
          .addOption('jw', 'javanese')
          .addOption('su', 'sundanese')
          .addOption('yue', 'cantonese')
          .setValue(this.plugin.settings.INPUT_LANGUAGE)
          .onChange(async value => {
            this.plugin.settings.INPUT_LANGUAGE = value as string;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Temperature')
      .setDesc('The randomness of the generated text')
      .addSlider(slider =>
        slider
          .setLimits(0, 2, 0.01)
          .setValue(this.plugin.settings.TEMPERATURE)
          .onChange(async value => {
            this.plugin.settings.TEMPERATURE = value;
            await this.plugin.saveSettings();
          })
          .setDynamicTooltip()
          .showTooltip()
      );

    new Setting(containerEl)
      .setName('Top P')
      .setDesc('The diversity of the generated text')
      .addSlider(slider =>
        slider
          .setLimits(0, 1, 0.01)
          .setValue(this.plugin.settings.TOP_P)
          .onChange(async value => {
            this.plugin.settings.TOP_P = value;
            await this.plugin.saveSettings();
          })
          .setDynamicTooltip()
          .showTooltip()
      );
    // Add the settings for each plugin
    for (const plugin of this.plugin.plugins) {
      plugin.addSettings(containerEl);
    }
  }
}
