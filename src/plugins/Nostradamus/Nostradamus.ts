import { Editor, MarkdownView, Notice, TFile, normalizePath } from 'obsidian';
import ArcanaPlugin from 'src/main';
import {
  removeFrontMatter,
  surroundWithMarkdown,
} from 'src/utilities/DocumentCleaner';
import { PromptTemplate } from 'langchain/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import ArcanaPluginBase from 'src/components/ArcanaPluginBase';

export default class NostradamusPlugin extends ArcanaPluginBase {
  private arcana: ArcanaPlugin;
  public constructor(arcana: ArcanaPlugin) {
    super();
    this.arcana = arcana;
  }

  public async onload() {
    // Register the nostradamus command
    this.arcana.addCommand({
      id: 'nostradamus',
      name: 'Nostradamus Rename',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        // Get the file name
        const file = view.file;
        if (!file) {
          return;
        }
        // Get the better name
        let betterName = await this.getBetterName(file);
        betterName = this.normalizeTitle(betterName);

        const parentFolder = file.parent;
        const parentName = normalizePath(parentFolder?.path ?? '');
        // Join the parent folder and the better name
        const newPath = normalizePath(`${parentName}/${betterName}`);

        // Rename the file
        await this.arcana.app.fileManager
          .renameFile(file, newPath)
          .catch(error => {
            new Notice(
              `Failed to rename file from ${file.basename} to ${betterName}: ${error}`
            );
          });
      },
    });
  }

  public async onunload() {}

  private async getBetterName(file: TFile): Promise<string> {
    // 1) Get the contents of the file
    let contents = await this.arcana.app.vault.read(file);
    // 2) Clean the contents
    contents = removeFrontMatter(contents);

    // 3) Construct the query request
    const context = `You are an AI that is helping rename files. You rename files using the contents of the file. You use some of the following as principles for renaming:\nWrite the note title as a complete thought\nAvoid vague note titles\nFavor descriptive titles over catchy or clever ones\n Use the kind of language that you'd use in a conversation\nAvoid starting note titles with conjunctions, articles, and prepositions\nAvoid including metadata in note titles\nYou will be given the contents of the file as well as the old title. You will need to return only the new title and nothing more. Do not use any of the following characters: " ' \` ~ ! @ # $ % ^ & * ( ) - _ = + [ ] { } \\ | ; : , . / < > ?"`;

    const question = `Old title - ${file.basename}\nNote contents:\n${contents}\n\nWhat is the new title?`;

    return await this.arcana.complete(question, context);
  }

  private normalizeTitle(title: string): string {
    // Remove the extension
    title = title.replace('.md', '');
    // Remove slashes and colons
    title = title.replace(/[:/\\]/g, '');
    // Add extension back
    title += '.md';
    return title;
  }
}
