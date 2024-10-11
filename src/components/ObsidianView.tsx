import ArcanaPlugin from 'src/main';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import { ArcanaContext } from '@/hooks/context';

// The general boiler plate for creating an obsidian view
export class ObsidianView extends ItemView {
  private arcana: ArcanaPlugin;
  private view: () => JSX.Element;
  private viewType: string;
  private iconName: string;
  private displayText: string;
  private root: Root | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    arcana: ArcanaPlugin,
    viewType: string,
    icon: string,
    displayText: string,
    view: () => JSX.Element
  ) {
    super(leaf);
    this.arcana = arcana;
    this.view = view;
    this.viewType = viewType;
    this.iconName = icon;
    this.displayText = displayText;
  }

  getDisplayText(): string {
    return this.displayText;
  }

  getIcon(): string {
    return this.iconName;
  }

  getViewType(): string {
    return this.viewType;
  }

  async onOpen(): Promise<void> {
    this.root = createRoot(this.containerEl.children[1]);

    this.root.render(
      <React.StrictMode>
        <ArcanaContext.Provider value={this.arcana}>
          {React.createElement(this.view)}
        </ArcanaContext.Provider>
      </React.StrictMode>
    );
  }

  destroy(): void {
    if (this.root) {
      this.root.unmount();
    }
  }
  async onClose(): Promise<void> {
    this.destroy();
  }
}
