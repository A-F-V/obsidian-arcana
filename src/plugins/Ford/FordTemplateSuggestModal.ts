import { App, SuggestModal, TFile, TFolder } from 'obsidian';

export default class FordTemplateSuggestModal extends SuggestModal<TFile> {
  private folderToSearch: string;
  private onSelect: (
    item: TFile,
    evt: MouseEvent | KeyboardEvent
  ) => Promise<void>;

  constructor(
    app: App,
    folderToSearch: string,
    onSelect: (item: TFile, evt: MouseEvent | KeyboardEvent) => Promise<void>
  ) {
    super(app);
    this.folderToSearch = folderToSearch;
    this.onSelect = onSelect;
  }

  getSuggestions(query: string): TFile[] | Promise<TFile[]> {
    const folder = this.app.vault.getAbstractFileByPath(this.folderToSearch);
    if (!folder || !(folder instanceof TFolder)) {
      return [];
    }
    const files = this.app.vault.getMarkdownFiles();
    return files.filter(file => file.parent === folder);
  }

  onChooseSuggestion(item: TFile, evt: MouseEvent | KeyboardEvent) {
    this.onSelect(item, evt);
  }

  renderSuggestion(item: TFile, el: HTMLElement) {
    el.createEl('div', { text: item.basename });
    el.createEl('small', { text: item.path });
  }
}
