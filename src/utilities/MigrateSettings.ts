import ArcanaSettings from '@/include/ArcanaSettings';

export default function migrateSettings(oldSettings: any): ArcanaSettings {
  // Check if we are using old agent settings:
  const settings = JSON.parse(JSON.stringify(oldSettings));

  if (settings.OPEN_AI_API_KEY) {
    settings.agentSettings = Object.assign({}, settings.agentSettings);
    // Assume all are old settings
    settings.agentSettings.OPEN_AI_API_KEY = settings.OPEN_AI_API_KEY;
    settings.agentSettings.ANTHROPIC_API_KEY = settings.ANTHROPIC_API_KEY;
    settings.agentSettings.MODEL_TYPE = settings.MODEL_TYPE;
    settings.agentSettings.INPUT_LANGUAGE = settings.INPUT_LANGUAGE;
    settings.agentSettings.TEMPERATURE = settings.TEMPERATURE;
    settings.agentSettings.TOP_P = settings.TOP_P;

    delete settings.OPEN_AI_API_KEY;
    delete settings.ANTHROPIC_API_KEY;
    delete settings.MODEL_TYPE;
    delete settings.INPUT_LANGUAGE;
    delete settings.TEMPERATURE;
    delete settings.TOP_P;
  }

  // Check if we are using old plugin settings:
  const oldPluginSettings = ['Christie', 'Darwin', 'Feynman', 'Ford', 'Nostradamus', 'Polo', 'Socrates'];
  settings.pluginSettings = Object.assign({}, settings.pluginSettings);
  for (const plugin of oldPluginSettings) {
    if (settings.PluginSettings && settings.PluginSettings[plugin]) {
      const newName = plugin.toLowerCase();
      settings.pluginSettings[newName] = Object.assign({}, settings.pluginSettings[newName]);
      settings.pluginSettings[newName] = settings.PluginSettings[plugin];
      delete settings.PluginSettings[plugin];
    }
  }
  delete settings.PluginSettings;

  return settings as ArcanaSettings;
}
