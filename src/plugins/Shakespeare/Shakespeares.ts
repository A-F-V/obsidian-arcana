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
            const body = await this.decodeNextSection(header, file);
            console.log(`Inserting header: ${header}`);
            console.log(`Inserting body: ${body}`);
            // Insert the header and body
            editor.replaceSelection(`${header}\n${body}`);
          }
        ).open();
      },
    });
  }

  public async onunload() {}

  private async decodeNextSection(header: string, file: TFile) {
    const title = file.basename;
    // Get the document text from the file
    const documentText = await this.arcana.app.vault.read(file);
    // Remove the front matter
    const cleanedText = removeFrontMatter(documentText);
    // Surround the text with markdown
    const markdownText = surroundWithMarkdown(cleanedText);

    // Create the prompt
    const prompt = new PromptTemplate({
      template:
        'Answer the users question as best as possible, being intelligent, concise, complete and creative.\n{question}',
      inputVariables: ['question'],
    });

    // Create the question
    const question = `Read the following text:\nTitle - ${title}\n${markdownText}\n\nNow write the body of the following section in a markdown friendly format, using latex equations and code where suitable:\n${header}\n`;
    // Create the query
    const query = await prompt.format({ question: question });
    // Create the query request
    return await this.arcana.complete(query);
  }
}
