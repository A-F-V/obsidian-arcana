import { ItemView, Plugin, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import { ArcanaContext } from '@/hooks/context';
import { ArcanaAgent } from '@/include/ArcanaAgent';

// The general boiler plate for creating an obsidian view
export class ObsidianView extends ItemView {
  private agent: ArcanaAgent;
  private plugin: Plugin;
  private view: () => JSX.Element;
  private viewType: string;
  private iconName: string;
  private displayText: string;
  private root: Root | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    agent: ArcanaAgent,
    plugin: Plugin,
    viewType: string,
    icon: string,
    displayText: string,
    view: () => JSX.Element
  ) {
    super(leaf);
    this.agent = agent;
    this.plugin = plugin;
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
        <ArcanaContext.Provider value={{ agent: this.agent, plugin: this.plugin, app: this.plugin.app }}>
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
