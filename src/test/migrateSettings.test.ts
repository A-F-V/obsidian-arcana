import migrateSettings from '../utilities/MigrateSettings';
import { defaultPluginSettings } from '../plugins/AllPlugins';
import { describe, it, expect } from '@jest/globals';

// Mock the obsidian module
jest.mock('obsidian');

describe('migrateSettings', () => {
  it('should migrate old settings to new format', () => {
    const oldSettings = {
      OPEN_AI_API_KEY: 'sk-randomOpenAIKey123456789abcdefghijklmnopqrstuvwxyz',
      ANTHROPIC_API_KEY: 'sk-ant-randomAnthropicKey987654321zyxwvutsrqponmlkjihgfedcba',
      MODEL_TYPE: 'gpt-4o',
      INPUT_LANGUAGE: 'en',
      TEMPERATURE: 0.67,
      TOP_P: 0.92,
      PluginSettings: {
        Socrates: {
          priorInstruction: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          usingWeb: false,
          serpApiToken: '',
          agent_folder: '📒 Library/Workflows/Agents',
          autoSendTranscription: true,
          ttsParams: {
            provider: 'google',
            rate: 2,
            pitch: -28,
            model: 'en-GB-Neural2-D',
            language: 'en-GB',
            voice: 'onyx',
          },
          autoSpeakReply: false,
          socratesMemorySize: 4,
        },
        Darwin: {
          minimum_tag_count_to_present: 3,
          only_suggest_existing_tags: true,
          max_tags_to_show: 3,
          tag_style: 'KebabCase',
        },
        Christie: {
          priorInstruction: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        },
        Feynman: {
          folder: '📒 Library/Flashcards',
        },
        Ford: {
          folder: '📒 Library/Workflows/MetadataTemplates',
        },
        Polo: {
          priorInstruction:
            'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
          showFilesInFolderStructure: false,
          showFileContent: true,
        },
      },
    };

    const migratedSettings = migrateSettings(oldSettings);

    // Check if agent settings were migrated correctly
    expect(migratedSettings.agentSettings).toEqual({
      OPEN_AI_API_KEY: 'sk-randomOpenAIKey123456789abcdefghijklmnopqrstuvwxyz',
      ANTHROPIC_API_KEY: 'sk-ant-randomAnthropicKey987654321zyxwvutsrqponmlkjihgfedcba',
      MODEL_TYPE: 'gpt-4o',
      INPUT_LANGUAGE: 'en',
      TEMPERATURE: 0.67,
      TOP_P: 0.92,
    });

    // Check if old agent settings were removed
    expect(migratedSettings).not.toHaveProperty('OPEN_AI_API_KEY');
    expect(migratedSettings).not.toHaveProperty('ANTHROPIC_API_KEY');
    expect(migratedSettings).not.toHaveProperty('MODEL_TYPE');
    expect(migratedSettings).not.toHaveProperty('INPUT_LANGUAGE');
    expect(migratedSettings).not.toHaveProperty('TEMPERATURE');
    expect(migratedSettings).not.toHaveProperty('TOP_P');

    // Check if plugin settings were migrated correctly
    expect(migratedSettings.pluginSettings).toBeDefined();
    expect(migratedSettings.pluginSettings.socrates).toEqual(oldSettings.PluginSettings.Socrates);
    expect(migratedSettings.pluginSettings.darwin).toEqual(oldSettings.PluginSettings.Darwin);
    expect(migratedSettings.pluginSettings.christie).toEqual(oldSettings.PluginSettings.Christie);
    expect(migratedSettings.pluginSettings.feynman).toEqual(oldSettings.PluginSettings.Feynman);
    expect(migratedSettings.pluginSettings.ford).toEqual(oldSettings.PluginSettings.Ford);
    expect(migratedSettings.pluginSettings.polo).toEqual(oldSettings.PluginSettings.Polo);

    // Check if old PluginSettings property was removed
    expect(migratedSettings).not.toHaveProperty('PluginSettings');
  });
});
