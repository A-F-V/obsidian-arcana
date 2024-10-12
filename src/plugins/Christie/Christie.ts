import { Editor, MarkdownView, TFile } from 'obsidian';
import {
  removeFrontMatter,
  surroundWithMarkdown,
} from 'src/utilities/DocumentCleaner';
import QuestionModal from 'src/components/QuestionModal';
import ArcanaPluginBase from 'src/components/ArcanaPluginBase';
import SerializableAborter from 'src/include/Aborter';
import { moveToEndOfLine } from 'src/include/CursorMover';
import { EditorAbortableTokenHandler } from 'src/include/AbortableTokenHandler';
import SettingsSection from '@/components/SettingsSection';
import { ChristieSettings, ChristieSettingsSection } from './ChristieSettings';

export default class ChristiePlugin extends ArcanaPluginBase<ChristieSettings> {
  public createSettingsSection(): SettingsSection<ChristieSettings> {
    return new ChristieSettingsSection(
      this.settings,
      this.arcana.getSettingSaver()
    );
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
            if (!file) {
              return;
            }
            // Get the current selected text
            const selectedText = editor.getSelection();
            // Decode the next section
            if (selectedText.length > 0) {
              moveToEndOfLine(editor);
              editor.replaceSelection('\n');
            }

            const aborter = new SerializableAborter();

            const abortableHandler = new EditorAbortableTokenHandler(
              aborter,
              editor.replaceSelection.bind(editor),
              editor,
              this.arcana
            );

            await this.askChristie(
              question,
              file,
              selectedText,
              abortableHandler.handleToken.bind(abortableHandler)
            ).finally(abortableHandler.onDone.bind(abortableHandler));
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
    let context = `You will be answering a question, completing an instruction or writing about '${title}.'`;
    if (documentText.length > 0) {
      context += `The document is:\n${markdownText}\n`;
    }
    if (this.settings.priorInstruction.length > 0) {
      context += `\n${this.settings.priorInstruction}\n`;
    }

    question = `The following is either a question to answer or an instruction to complete: ${question.trim()}.`;
    if (selectedText.length > 0) {
      question += `\n*Note, the user has selected the following passage*:\n${selectedText}\n`;
    }
    await this.arcana.complete(question, context, tokenHandler);
  }
}
