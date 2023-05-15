export default interface ArcanaSettings {
  OPEN_AI_API_KEY: string;
  MODEL_TYPE: string;
  TEMPERATURE: number;
  TOP_P: number;
  PluginSettings: {
    [key: string]: any;
  };
}
