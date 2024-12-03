import SettingsSection from './SettingsSection';
import { AgentSettings, isAvailableModel, ModelDisplayNames } from '../include/ArcanaSettings';
import { DropdownComponent, Setting } from 'obsidian';

export default class AgentSettingsSection extends SettingsSection<AgentSettings> {
  public sectionTitle = 'AI Agent';

  display(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('OpenAI API key')
      .setDesc('Your OpenAI API key')
      .addText(text =>
        text
          .setPlaceholder('OpenAI API Key')
          .setValue(this.settings.OPEN_AI_API_KEY)
          .onChange(async value => {
            this.settings.OPEN_AI_API_KEY = value;
            await this.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Anthropic API key')
      .setDesc('Your Anthropic API key')
      .addText(text =>
        text
          .setPlaceholder('Anthropic API key')
          .setValue(this.settings.ANTHROPIC_API_KEY)
          .onChange(async value => {
            this.settings.ANTHROPIC_API_KEY = value;
            await this.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Model type')
      .setDesc('The model to use for generating text')
      .addDropdown(
        ((dropdown: DropdownComponent) => {
          // Add all the options
          Object.entries(ModelDisplayNames).forEach(([key, value]) => {
            dropdown.addOption(key, value);
          });

          const loadedModel = isAvailableModel(this.settings.MODEL_TYPE) ? this.settings.MODEL_TYPE : 'gpt-4o-mini';

          dropdown.setValue(loadedModel).onChange(async value => {
            if (!isAvailableModel(value)) {
              console.error('Invalid model: ' + value);
              return;
            }
            this.settings.MODEL_TYPE = value;
            await this.saveSettings();
          });
        }).bind(this)
      );

    new Setting(containerEl)
      .setName('Text to speech language')
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
          .setValue(this.settings.INPUT_LANGUAGE)
          .onChange(async value => {
            this.settings.INPUT_LANGUAGE = value as string;
            await this.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Temperature')
      .setDesc('The randomness of the generated text')
      .addSlider(slider =>
        slider
          .setLimits(0, 2, 0.01)
          .setValue(this.settings.TEMPERATURE)
          .onChange(async value => {
            this.settings.TEMPERATURE = value;
            await this.saveSettings();
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
          .setValue(this.settings.TOP_P)
          .onChange(async value => {
            this.settings.TOP_P = value;
            await this.saveSettings();
          })
          .setDynamicTooltip()
          .showTooltip()
      );
  }
}
