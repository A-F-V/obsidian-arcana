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
  emoji: string;
};

export class AgentDataLoader {
  private static defaultAgentEmoji = '🤖';

  public static async fromFile(
    arcana: ArcanaPlugin,
    file: TFile
  ): Promise<AgentData | null> {
    const fmm = new FrontMatterManager(arcana);
    const name = file.basename;

    if (!name || name == 'Socrates') return null;

    let emoji =
      (await fmm.get<string>(file, 'arcana-agent-emoji')) ??
      this.defaultAgentEmoji;

    console.log(emoji);

    if (!isEmoji(emoji)) emoji = this.defaultAgentEmoji;
    // initial message is the contents of the file

    const initialMessage = removeFrontMatter(await arcana.app.vault.read(file));

    return { name, initialMessage, emoji };
  }
}
