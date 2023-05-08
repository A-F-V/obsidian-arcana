import { Editor, MarkdownView, Modal, TFile } from 'obsidian';
import ArcanaPlugin from 'src/main';
import {
  removeFrontMatter,
  surroundWithMarkdown,
} from 'src/utilities/DocumentCleaner';
import { PromptTemplate } from 'langchain/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import QuestionModal from 'src/components/QuestionModal';

export default class SocratesPlugin {
  private arcana: ArcanaPlugin;
  public constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
  }

  public async onload() {
    // Register the nostradamus command
    this.arcana.addCommand({
      id: 'socrates',
      name: 'Socrates Think',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        // Create a modal
        new QuestionModal(
          this.arcana.app,
          'Ask a question',
          async (question: string) => {
            // Get the current file
            const file = view.file;
            // Get the current selected text
            const selectedText = editor.getSelection();
            // Decode the next section
            console.log(`Inserting question: ${question}`);
            if (selectedText.length > 0) {
              // Move the cursor to the end of the file
              editor.setCursor(editor.lastLine(), 0);
            }

            await this.askSocrates(
              question,
              file,
              selectedText,
              (token: string) => {
                editor.replaceSelection(token);
              }
            );
          }
        ).open();
      },
    });
  }

  public async onunload() {}

  public addSettings(containerEl: HTMLElement) {}

  private async askSocrates(
    question: string,
    file: TFile,
    selectedText: string,
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
    let context = `You are an AI that is an excellent teacher, like Socrates. You give great clarity and insights, but are concise and terse when necessary. Do NOT surround your answer in a markdown block. Avoid repeating what has already been written. You will be answering a question on '${title}.\n'`;
    if (documentText.length > 0) {
      context += `The document is:\n${markdownText}\n`;
    }
    if (selectedText.length > 0) {
      question += `\n*Note, the user has selected the following passage*:\n${selectedText}\n`;
    }
    await this.arcana.complete(question, context, tokenHandler);
  }
}
