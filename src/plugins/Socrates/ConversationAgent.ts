import { TFile } from 'obsidian';
import FrontMatterManager from 'src/include/FrontMatterManager';
import hash from 'src/include/Hasher';
import { isEmoji } from 'src/include/TextPostProcesssing';
import ArcanaPlugin from 'src/main';
import { removeFrontMatter } from 'src/utilities/DocumentCleaner';

// A type representing all the agent data
export type AgentData = {
  name: string;
  initialMessage: string;
  agentEmoji: string;
  userEmoji: string;
};

export class AgentDataLoader {
  private static defaultAgentEmoji = '🤖';
  private static defaultUserEmoji = '😀';

  public static async fromFile(
    arcana: ArcanaPlugin,
    file: TFile
  ): Promise<AgentData | null> {
    const fmm = new FrontMatterManager(arcana);

    // Agent name is name of the file
    const name = file.basename;
    if (!name || name == 'Socrates') return null;

    // Agent Emoji
    let agentEmoji =
      (await fmm.get<string>(file, 'arcana-agent-emoji')) ??
      this.defaultAgentEmoji;
    if (!isEmoji(agentEmoji)) agentEmoji = this.defaultAgentEmoji;
    // User Emoji
    let userEmoji =
      (await fmm.get<string>(file, 'arcana-user-emoji')) ??
      this.defaultUserEmoji;

    if (!isEmoji(userEmoji)) userEmoji = this.defaultUserEmoji;

    // initial message is the contents of the file
    const initialMessage = removeFrontMatter(await arcana.app.vault.read(file));

    return { name, initialMessage, agentEmoji, userEmoji };
  }
}
