import { Editor, MarkdownView, TFile } from 'obsidian';
import ArcanaPlugin from 'src/main';
import {
  removeFrontMatter,
  surroundWithMarkdown,
} from 'src/utilities/DocumentCleaner';
import QuestionModal from 'src/components/QuestionModal';
import ArcanaPluginBase from 'src/components/ArcanaPluginBase';
import Aborter from 'src/include/Aborter';

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
              const editorPosition = editor.getCursor();
              // Get the text on the line
              const lineText = editor.getLine(editorPosition.line);
              editor.setCursor(editorPosition.line, lineText.length);
              editor.replaceSelection('\n');
            }

            const aborter = new Aborter();

            const handler = (event: KeyboardEvent) => {
              if (event.key === 'Escape') {
                aborter.abort();
              }
            };
            window.addEventListener('keydown', handler);

            const release = () => {
              window.removeEventListener('keydown', handler);
              aborter.abort();
            };
            this.arcana.registerResource(release);

            // If the users moves the cursor, abort
            let lastPosition = editor.getCursor();
            const hasCursorMoved = () => {
              const currentPosition = editor.getCursor();
              return (
                currentPosition.line != lastPosition.line ||
                currentPosition.ch != lastPosition.ch
              );
            };
            console.log('Asking Christie');
            await this.askChristie(
              question,
              file,
              selectedText,
              (token: string) => {
                if (hasCursorMoved()) {
                  aborter.abort();
                }
                if (aborter.isAborted()) return;
                editor.replaceSelection(token);
                lastPosition = editor.getCursor();
              }
            ).finally(release);
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
    let context = `'You are an AI that is an excellent writer and scholar. You write with a academic and domain specific vocabulary. You are concise and to the point. You are writing in a markdown file and are free to use bolding etc. Do NOT surround your answer in a markdown block. Avoid repeating what has already been written. You will be answering a question, completing an instruction or writing about '${title}.\n'`;
    if (documentText.length > 0) {
      context += `The document is:\n${markdownText}\n`;
    }
    question = `The following is either a question to answer or an instruction to complete: ${question.trim()}. `;
    if (selectedText.length > 0) {
      question += `\n*Note, the user has selected the following passage*:\n${selectedText}\n`;
    }
    await this.arcana.complete(question, context, tokenHandler);
  }
}
