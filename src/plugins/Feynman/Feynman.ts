import { Editor, MarkdownView, Modal, TFile, WorkspaceLeaf } from 'obsidian';
import ArcanaPlugin from 'src/main';
import {
  removeFrontMatter,
  surroundWithMarkdown,
} from 'src/utilities/DocumentCleaner';
import { PromptTemplate } from 'langchain/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import QuestionModal from 'src/components/QuestionModal';
import StorageManager from 'src/include/StorageManager';
import { assert } from 'console';

export default class FeynmanPlugin {
  private arcana: ArcanaPlugin;
  private folder = 'FeynmanFlashcards'; // TODO: Make this configurable

  public constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
    // If the folder doesn't exist, create it
    if (!this.arcana.app.vault.getAbstractFileByPath(this.folder)) {
      this.arcana.app.vault.createFolder(this.folder);
    }
  }

  public async onload() {
    // Register the nostradamus command
    this.arcana.addCommand({
      id: 'feynman',
      name: 'Feynman Flashcard',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const oldFile = view.file;
        // Get current file name
        const newFileName = `${this.folder}/Flashcard - ${oldFile.basename}.md`;
        // Create a new file
        let newFile = this.arcana.app.vault.getAbstractFileByPath(newFileName);
        if (newFile) {
          console.log(`File already exists: ${newFileName}`);
        } else {
          newFile = await this.arcana.app.vault.create(newFileName, '');
        }
        // Open the new file and set to active
        await this.arcana.app.workspace.openLinkText(newFile.path, '', true);
        // Find the leaf with the new file
        let flashcardLeaf: WorkspaceLeaf | null = null;
        this.arcana.app.workspace.iterateAllLeaves(leaf => {
          if (
            leaf.view instanceof MarkdownView &&
            (leaf.view as MarkdownView).file.path === newFile!.path
          ) {
            flashcardLeaf = leaf;
          }
        });
        assert(flashcardLeaf !== null, 'Could not find the new leaf');
        const newEditor = (flashcardLeaf!.view as MarkdownView).editor;

        // Place cursor at the end of the file
        newEditor.setCursor(newEditor.lastLine(), 0);
        newEditor.replaceSelection(`#flashcard\n\n`); // TODO: Give category as well
        // Start writing the flashcards
        await this.askFeynman(oldFile, (token: string) => {
          newEditor.replaceSelection(token);
        });
      },
    });
  }

  public async onunload() {}

  private async askFeynman(file: TFile, tokenHandler: (token: string) => void) {
    const numberOfQuestions = 5;

    const title = file.basename;
    // Get the document text from the file
    const documentText = await this.arcana.app.vault.read(file);
    // Remove the front matter
    const cleanedText = removeFrontMatter(documentText);
    // Surround the text with markdown
    const markdownText = surroundWithMarkdown(cleanedText);

    // Create the context
    const exampleFlashcard = `What is the pythagorean theorem?\n??\nThe pythagorean theorem relates the sides of a right triangle.\nIf the triangle has sides a, b, and c, where c is the hypotenuse, then $$a^2 + b^2 = c^2$$\n`;
    let context = `You are an AI that is helping write flashcards for the purpose of spaced repition. Flashcards should have the following format: '<question>\n??\n<answer>'.\n Here is an example flashcard:\n${exampleFlashcard}You will be a writing it on the subject matter of:'${title}.\n'`;
    if (documentText.length > 0) {
      context += `The document is:\n${markdownText}\n`;
    }

    context += `\n`;

    const question = `Write ${numberOfQuestions} flashcards on the subject matter of '${title}', using the following passage as a reference:\n${markdownText}\n`;

    await this.arcana.complete(question, context, tokenHandler);
  }
}
