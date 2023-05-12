import { Editor, MarkdownView, TFile } from 'obsidian';
import ArcanaPlugin from 'src/main';
import {
  removeFrontMatter,
  surroundWithMarkdown,
} from 'src/utilities/DocumentCleaner';
import QuestionModal from 'src/components/QuestionModal';
import ArcanaPluginBase from 'src/components/ArcanaPluginBase';

export default class ChristiePlugin extends ArcanaPluginBase {
  private arcana: ArcanaPlugin;
  public constructor(arcana: ArcanaPlugin) {
    super();
    this.arcana = arcana;
  }

  public async onload() {
    // Register the nostradamus command
    this.arcana.addCommand({
      id: 'christie',
      name: 'Christie Write',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        // Create a modal
        new QuestionModal(
          this.arcana.app,
          'Ask a question or give an instruction',
          async (question: string) => {
            // Get the current file
            const file = view.file;
            // Get the current selected text
            const selectedText = editor.getSelection();
            // Decode the next section
            if (selectedText.length > 0) {
              // Move the cursor to the end of the file
              editor.setCursor(editor.lastLine(), 0);
            }

            await this.askChristie(
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

  private async askChristie(
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
    let context = `'You are an AI that is an excellent writer and scholar. You write with a academic and domain specific vocabulary. You are concise and to the point. Do NOT surround your answer in a markdown block. Avoid repeating what has already been written. You will be answering a question or given an instruction regarding '${title}.\n'`;
    if (documentText.length > 0) {
      context += `The document is:\n${markdownText}\n`;
    }
    if (selectedText.length > 0) {
      question += `\n*Note, the user has selected the following passage*:\n${selectedText}\n`;
    }
    await this.arcana.complete(question, context, tokenHandler);
  }
}
