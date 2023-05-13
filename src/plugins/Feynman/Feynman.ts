import {
  Editor,
  MarkdownView,
  Notice,
  Setting,
  TFile,
  WorkspaceLeaf,
} from 'obsidian';
import ArcanaPlugin from 'src/main';
import {
  removeFrontMatter,
  surroundWithMarkdown,
} from 'src/utilities/DocumentCleaner';

import { assert } from 'console';
import ArcanaPluginBase from 'src/components/ArcanaPluginBase';

export default class FeynmanPlugin extends ArcanaPluginBase {
  private arcana: ArcanaPlugin;
  private setting: { folder: string };

  public constructor(arcana: ArcanaPlugin) {
    super();
    this.arcana = arcana;
  }

  private ensureFolderExists() {
    if (!this.arcana.app.vault.getAbstractFileByPath(this.setting.folder)) {
      this.arcana.app.vault.createFolder(this.setting.folder);
    }
  }
  public async onload() {
    this.setting = this.arcana.settings.PluginSettings['Feynman'] ?? {
      folder: 'FeynmanFlashcards', // The default setting
    };
    // Register the nostradamus command
    this.arcana.addCommand({
      id: 'feynman',
      name: 'Feynman Flashcard',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        this.ensureFolderExists();
        // Get the current file
        const oldFile = view.file;
        // Get current file name
        const newFileName = `${this.setting.folder}/Flashcard - ${oldFile.basename}.md`;
        // Create a new file
        let newFile = this.arcana.app.vault.getAbstractFileByPath(newFileName);
        if (newFile) {
          new Notice(
            `File already exists: ${newFileName}. Please delete it first.`
          );
          return;
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
        // Start writing the flashcards
        await this.askFeynman(oldFile, (token: string) => {
          newEditor.replaceSelection(token);
        });
      },
    });
  }

  public addSettings(containerEl: HTMLElement) {
    containerEl.createEl('h2', { text: 'Feynman Flashcards' });

    new Setting(containerEl)
      .setName('Feynman Flashcard Folder')
      .setDesc('The folder where the flashcards will be stored')
      .addText(text => {
        text
          .setPlaceholder('Flashcards')
          .setValue(this.setting.folder)
          .onChange(async (value: string) => {
            this.setting.folder = value;
            this.arcana.settings.PluginSettings['Feynman'] = { folder: value };
            await this.arcana.saveSettings();
          });
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

    // Part 1) Get the category
    const context = `You are an AI that is helping write flashcards for the purpose of space repitition. You will need to figure out what the category of the flashcard is. The format is as follows: "#flashcards/<category>". The category may be hierarchical. For example, if the document was about pythagerous' theorem, then you would write '#flashcards/mathematics/geometry'. The depth of the category should be no more than 2 levels deep, and should be hierarchical. Keep it very general. Also, use lower case kebeb case for the category names.`;
    const question = `What is the flashcard category of this document, titled '${title}'?\n${markdownText}\n`;
    await this.arcana.complete(question, context, (token: string) =>
      tokenHandler(token.toLowerCase())
    );
    tokenHandler(`\n\n`);
    // Part 2) Ask the questions
    // Create the context
    const exampleFlashcard = `What is the pythagorean theorem?\n??\nThe pythagorean theorem relates the sides of a right triangle.\nIf the triangle has sides a, b, and c, where c is the hypotenuse, then $$a^2 + b^2 = c^2$$\n`;
    let context2 = `You are an AI that is helping write flashcards for the purpose of spaced repition. Flashcards should have the following format: '<question>\n??\n<answer>'.\n Here is an example flashcard:\n${exampleFlashcard}Do NOT number the flashcards. You will be a writing it on the subject matter of:'${title}.\n'`;
    if (documentText.length > 0) {
      context2 += `The document is:\n${markdownText}\n`;
    }

    context2 += `\n`;

    const question2 = `Write ${numberOfQuestions} flashcards (DO NOT NUMBER THE FLASHCARDS) on the subject matter of '${title}', using the following passage as a reference:\n${markdownText}\n`;

    await this.arcana.complete(question2, context2, tokenHandler);
  }
}
