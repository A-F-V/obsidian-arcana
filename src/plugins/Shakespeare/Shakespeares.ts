import { Editor, MarkdownView, Modal, TFile } from 'obsidian';
import ArcanaPlugin from 'src/main';
import {
  removeFrontMatter,
  surroundWithMarkdown,
} from 'src/utilities/DocumentCleaner';
import { PromptTemplate } from 'langchain/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import QuestionModal from 'src/components/QuestionModal';

export default class ShakespearePlugin {
  private arcana: ArcanaPlugin;
  public constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
  }

  public async onload() {
    // Register the nostradamus command
    this.arcana.addCommand({
      id: 'shakespeare',
      name: 'Shakespeare Write',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        // Create a modal
        new QuestionModal(
          this.arcana.app,
          'Write the section header',
          async (header: string) => {
            // Get the current file
            const file = view.file;
            // Decode the next section
            console.log(`Inserting header: ${header}`);
            editor.replaceSelection(`${header}\n`);

            await this.decodeNextSection(header, file, (token: string) => {
              editor.replaceSelection(token);
            });
          }
        ).open();
      },
    });
  }

  public addSettings(containerEl: HTMLElement) {}
  public async onunload() {}

  private async decodeNextSection(
    header: string,
    file: TFile,
    tokenHandler: (token: string) => void
  ) {
    const title = file.basename;
    // Get the document text from the file
    const documentText = await this.arcana.app.vault.read(file);
    // Remove the front matter
    const cleanedText = removeFrontMatter(documentText);
    // Surround the text with markdown
    const markdownText = surroundWithMarkdown(cleanedText);

    // Create the context
    const context =
      'You are an AI that is an excellent teacher. You give great clarity and insights, but are concise and terse when necessary. Do NOT surround your answer in a markdown block. Avoid repiting what has already been written.';
    // Create the question
    const query = `Title - ${title}\nText - \n${markdownText}\nHeader - ${header}\n Now write ONLY the section body:`;
    // Create the query request

    await this.arcana.complete(query, context, tokenHandler);
  }
}
