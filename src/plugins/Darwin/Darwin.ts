import { Editor, MarkdownView, TFile } from 'obsidian';
import ArcanaPlugin from 'src/main';
import { removeFrontMatter } from 'src/utilities/DocumentCleaner';

import ArcanaPluginBase from 'src/components/ArcanaPluginBase';
import FrontMatterManager from 'src/include/FrontMatterManager';

export default class DarwinPlugin extends ArcanaPluginBase {
  private arcana: ArcanaPlugin;
  private setting: { folder: string };
  private tags: Array<string> = [];

  public constructor(arcana: ArcanaPlugin) {
    super();
    this.arcana = arcana;
  }

  private async getAllTagsInVault() {
    const fmm = new FrontMatterManager(this.arcana);
    const tagSet = new Set<string>();
    for (const file of this.arcana.app.vault.getMarkdownFiles()) {
      const tags = await fmm.getTags(file);
      tags.forEach(tag => {
        tagSet.add(tag);
      });
    }
    this.tags = Array.from(tagSet).sort();
  }

  public async onload() {
    // Get lits of all tags
    await this.getAllTagsInVault();

    this.arcana.addCommand({
      id: 'darwin',
      name: 'Darwin Tag',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        // Get tags in the current file
        const fmm = new FrontMatterManager(this.arcana);
        const tags = await fmm.getTags(view.file);

        const tagsToAdd = await this.askDarwin(view.file, tags);
        console.log(`Tags in file: ${tags.join(', ')}`);
        console.log(`Tags in vault: ${this.tags.join(', ')}`);
        console.log(`Tags to add: ${tagsToAdd.join(', ')}`);

        // Add the tags to the file
        await fmm.setTags(view.file, tags.concat(tagsToAdd));
      },
    });
  }

  public async onunload() {}

  private async askDarwin(
    file: TFile,
    existingTags: string[]
  ): Promise<string[]> {
    const title = file.basename;
    // Get the document text from the file
    const documentText = await this.arcana.app.vault.read(file);
    // Remove the front matter
    const cleanedText = removeFrontMatter(documentText);

    const context = `You are an AI helping to give tags to a file. Here is a list of tags that the user has used before across other files: ${this.tags.join(
      ' '
    )}.\n Answer by giving between 2 and 5 tags that you think are relevant to the file. You can also give tags that the user has not used before, but try to use one from the list above. You should answer by giving the tags for the file in lowercase kebab-case and seperated by spaces. You will be given the title of the file, the text in the file and the tags already present. Do not repeat tags that are already present in this file.\n\nAs an example, if you think we should add the tags 'computer-scienc', 'complexity-theory' and 'alan-turing', then you should write 'computer-science complexity-theory alan-turing'.`;

    const details = `Title of file: ${title}\n\nText in file: ${cleanedText}\n\nTags already present: ${existingTags.join(
      ' '
    )}`;

    const response = await this.arcana.complete(details, context);
    return response
      .split(' ')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }
}
