import { Editor, MarkdownView, Notice, TFile, normalizePath } from 'obsidian';
import ArcanaPlugin from 'src/main';
import {
  removeFrontMatter,
  surroundWithMarkdown,
} from 'src/utilities/DocumentCleaner';
import { PromptTemplate } from 'langchain/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';

export default class NostradamusPlugin {
  private arcana: ArcanaPlugin;
  public constructor(arcana: ArcanaPlugin) {
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
        // Get the better name
        let betterName = await this.getBetterName(file);
        // If the betterName does not include .md then add it
        if (!betterName.endsWith('.md')) {
          betterName += '.md';
        }
        // Get the parent folder of the file
        const parentFolder = file.parent;
        const parentName = normalizePath(parentFolder?.path ?? '');
        // Join the parent folder and the better name
        const newPath = normalizePath(`${parentName}/${betterName}`);

        // Rename the file
        console.log(`Renaming ${file.path} to ${newPath}`);
        await this.arcana.app.vault.rename(file, newPath).catch(error => {
          new Notice(`Failed to rename file: ${error}`);
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
    contents = surroundWithMarkdown(contents);
    // 3) Construct the query request
    // TODO: Can refactor into simpler api?
    // With a `StructuredOutputParser` we can define a schema for the output.
    const parser = StructuredOutputParser.fromNamesAndDescriptions({
      title: 'The title of the file',
    });

    const formatInstructions = parser.getFormatInstructions();

    const prompt = new PromptTemplate({
      template:
        'Answer the users question as best as possible.\n{format_instructions}\n{question}',
      inputVariables: ['question'],
      partialVariables: { format_instructions: formatInstructions },
    });
    // 4) Query the API
    const query = await prompt.format({
      question: `Please give the below file a suitable title.\n${contents}`,
    });
    const response = await this.arcana.complete(query);
    // 5) Return the response
    let title = (await parser.parse(response)).title;
    // Remove bad characters from title
    title = title.replace(/[/\\]/g, '');
    title = title.replace(/[:]/g, ' -');

    return title;
  }
}
