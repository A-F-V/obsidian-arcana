import { Editor, MarkdownView, Notice, TFile, WorkspaceLeaf } from 'obsidian';
import { removeFrontMatter, surroundWithMarkdown } from 'src/utilities/DocumentCleaner';

import { assert } from 'console';
import ArcanaPluginBase from 'src/components/ArcanaPluginBase';
import QuestionModal from 'src/components/QuestionModal';
import FrontMatterManager from 'src/include/FrontMatterManager';
import { moveToEndOfFile } from 'src/include/CursorMover';
import SerializableAborter from 'src/include/Aborter';
import { EditorAbortableTokenHandler } from 'src/include/AbortableTokenHandler';
import SettingsSection from '@/components/SettingsSection';
import { FeynmanSettings, FeynmanSettingsSection } from './FeynmanSettings';

export default class FeynmanPlugin extends ArcanaPluginBase<FeynmanSettings> {
  public createSettingsSection(): SettingsSection<FeynmanSettings> {
    return new FeynmanSettingsSection(this.settings, this.saveSettings);
  }

  private ensureFolderExists() {
    if (!this.app.vault.getAbstractFileByPath(this.settings.folder)) {
      this.app.vault.createFolder(this.settings.folder);
    }
  }
  public async onload() {
    // Register the nostradamus command
    this.plugin.addCommand({
      id: 'feynman',
      name: 'Feynman Flashcard',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        new QuestionModal(this.app, 'How many flashcards do you want to create?', async (answer: string) => {
          const numberOfFlashcards = parseInt(answer);
          if (isNaN(numberOfFlashcards) || numberOfFlashcards <= 0) {
            new Notice('Please enter a valid number');
            return;
          }

          this.ensureFolderExists();
          // Get the current file
          const oldFile = view.file;
          if (!oldFile) {
            return;
          }
          // Get current file name
          const newFileName = `${this.settings.folder}/Flashcard - ${oldFile.basename}.md`;
          // Create a new file
          let newFile = this.app.vault.getAbstractFileByPath(newFileName);
          if (newFile) {
            new Notice(`File already exists: ${newFileName}. Please delete it first.`);
            return;
          } else {
            newFile = await this.app.vault.create(newFileName, '');
          }
          // Open the new file and set to active
          await this.app.workspace.openLinkText(newFile.path, '', true);
          // Find the leaf with the new file
          let flashcardLeaf: WorkspaceLeaf | null = null;
          this.app.workspace.iterateAllLeaves(leaf => {
            if (leaf.view instanceof MarkdownView && (leaf.view as MarkdownView).file?.path === newFile?.path) {
              flashcardLeaf = leaf;
            }
          });
          assert(flashcardLeaf !== null, 'Could not find the new leaf');
          const newEditor = (flashcardLeaf!.view as MarkdownView).editor;

          // Place cursor at the end of the file
          newEditor.setCursor(newEditor.lastLine(), 0);
          const aborter = new SerializableAborter();
          const abortHandler = new EditorAbortableTokenHandler(
            aborter,
            newEditor.replaceSelection.bind(newEditor),
            newEditor,
            this.plugin
          );
          // Start writing the flashcards
          await this.askFeynman(
            oldFile,
            numberOfFlashcards,
            async (tag: string) => {
              const fmm = new FrontMatterManager(this.app.fileManager);
              await fmm.setTags(newFile as TFile, [tag]);
              // Pause 1 second to let tags be written
              await new Promise(resolve => setTimeout(resolve, 1000));

              moveToEndOfFile(newEditor);
              newEditor.replaceSelection(`Flashcards for [[${oldFile.basename}]]\n\n`);
            },
            abortHandler.handleToken.bind(abortHandler)
          ).finally(abortHandler.onDone.bind(abortHandler));
        }).open();
      },
    });
  }

  public async onunload() {}

  private async askFeynman(
    file: TFile,
    numberOfQuestions: number,
    writeTag: (tag: string) => Promise<void>,
    tokenHandler: (token: string) => void
  ) {
    const title = file.basename;
    // Get the document text from the file
    const documentText = await this.app.vault.read(file);
    // Remove the front matter
    const cleanedText = removeFrontMatter(documentText);
    // Surround the text with markdown
    const markdownText = surroundWithMarkdown(cleanedText);

    // Part 1) Get the category
    const context = `You are an AI that is helping write flashcards for the purpose of space repitition. You will need to figure out what the category of the flashcard is. The format is as follows: "flashcards/<category>". The category may be hierarchical. For example, if the document was about pythagerous' theorem, then you would write '#flashcards/mathematics/geometry'. The depth of the category should be no more than 2 levels deep, and should be hierarchical. Keep it very general. Also, use lower case kebeb case for the category names.`;
    const question = `What is the flashcard category of this document, titled '${title}'?\n${markdownText}\n`;

    let tag = await this.agent.complete(question, context);
    tag = tag.trim().toLowerCase().replace(/ /g, '-').replace(/"/g, '').replace(/#/g, '');
    await writeTag(tag);

    // Part 2) Ask the questions
    // Create the context
    const exampleFlashcard = `What is the pythagorean theorem?\n?\nThe pythagorean theorem relates the sides of a right triangle.\nIf the triangle has sides a, b, and c, where c is the hypotenuse, then $$a^2 + b^2 = c^2$$\n`;
    let context2 = `You are an AI that is helping write flashcards for the purpose of spaced repitition. Flashcards should have the following format: '<question>\n?\n<answer>'.\n Here is an example flashcard:\n${exampleFlashcard}\nDo NOT number the flashcards. Make sure each question you as is atomic, so that it only asks one thing, i.e. avoids the use of 'and'. You do not need to write flashcards on everything in the document, just start with the most important.\n You will be a writing it on the subject matter of:'${title}.\n'`;
    if (documentText.length > 0) {
      context2 += `The document is:\n${markdownText}\n`;
    }

    context2 += `\n`;

    const question2 = `Write ${numberOfQuestions} flashcards (DO NOT NUMBER THE FLASHCARDS) on the subject matter of '${title}', using the following passage as a reference:\n${markdownText}\n`;

    await this.agent.complete(question2, context2, tokenHandler);
  }
}
