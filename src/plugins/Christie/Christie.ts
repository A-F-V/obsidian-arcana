import { Editor, MarkdownView, Modal, TFile } from 'obsidian';
import ArcanaPlugin from 'src/main';
import {
  removeFrontMatter,
  surroundWithMarkdown,
} from 'src/utilities/DocumentCleaner';
import { PromptTemplate } from 'langchain/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import QuestionModal from 'src/components/QuestionModal';

export default class ChristiePlugin {
  private arcana: ArcanaPlugin;
  public constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
  }

  public async onload() {
    // Register the nostradamus command
    this.arcana.addCommand({
      id: 'shakespeare',
      name: 'Christie Write',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        // Create a modal
        new QuestionModal(
          this.arcana.app,
          'Write the section header',
          async (header: string) => {
            // Get the current file
            const file = view.file;
            // Decode the next section
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

  private getQuantityContext(message: string): string {
    // Count the number of '#' in the message
    const count = (message.match(/#/g) || []).length;
    console.log(count);
    const m1 = 'You are required to give a lengthy and in-depth answer.';
    const m2 =
      'You are required to give a decent sized answer. Do NOT an introduction or a conclusion, answer the question directly.';
    const m3 =
      'You are required to give a brief but complete answer. Do NOT an introduction or a conclusion, answer the question directly.';
    return count == 1 ? m1 : count == 2 ? m2 : m3;
  }
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
      'You are an AI that is an excellent writer and scholar. You write with a academic and domain specific vocabulary. You are concise and to the point.\n You are asked to complete the following section of notes for of a graduate level university course. You are provided with the title of the note, the previous body of the notes, and the section header. You do not repeat what has already been said. ' +
      this.getQuantityContext(header);

    // Create the question
    const query = `Title - ${title}\nRest of Note - \n${markdownText}\nHeader - ${header}\n Now write ONLY the section body:`;
    // Create the query request

    await this.arcana.complete(query, context, tokenHandler);
  }
}
