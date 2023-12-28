import { TAbstractFile, TFile, TFolder, Vault } from 'obsidian';

export class FSTraversalNode {
  // A TAbstractFile tree
  value: TAbstractFile;
  private children: FSTraversalNode[];
  constructor(node_: TAbstractFile) {
    this.value = node_;
    this.children = [];
  }

  public applyAtParentOf(
    child: TAbstractFile,
    f: (parent: FSTraversalNode, child: TAbstractFile) => void
  ): void {
    // if the child is the node, do nothing
    if (this.value === child) {
      return;
    }
    // Ensure that the child is a descendant of the node
    if (!FSTraversalNode.isDescendant(this.value, child)) {
      throw new Error(
        `Child ${child.path} is not a descendant of ${this.value.path}`
      );
    }
    for (const node of this.children) {
      if (FSTraversalNode.isDescendant(node.value, child)) {
        node.applyAtParentOf(child, f);
        return;
      }
    }
    f(this, child);
  }

  public add(child: TAbstractFile) {
    this.applyAtParentOf(
      child,
      (parent: FSTraversalNode, child: TAbstractFile) => {
        parent.addNewChild(child);
      }
    );
  }

  public remove(child: TAbstractFile) {
    this.applyAtParentOf(
      child,
      (parent: FSTraversalNode, child: TAbstractFile) => {
        parent.removeChild(child);
      }
    );
  }

  public removeIf(pred: (node: TAbstractFile) => boolean) {
    this.applyAll(
      (node: TAbstractFile) => {
        return pred(node);
      },
      (node: FSTraversalNode) => {
        this.remove(node.value);
      }
    );
  }

  public applyAll(
    pred: (node: TAbstractFile) => boolean,
    f: (node: FSTraversalNode) => void
  ) {
    if (pred(this.value)) {
      f(this);
    }
    this.children.forEach((child: FSTraversalNode) => {
      child.applyAll(pred, f);
    });
  }

  public prefixTraverse(f: (node: TAbstractFile) => void): void {
    f(this.value);
    this.children.forEach((child: FSTraversalNode) => {
      child.prefixTraverse(f);
    });
  }

  private removeChild(child: TAbstractFile): void {
    if (child.parent !== this.value) {
      throw new Error(
        `Child ${child.path} is not a child of ${this.value.path}`
      );
    }
    // Remove the child
    this.children = this.children.filter((node: FSTraversalNode) => {
      return node.value !== child;
    });
  }

  // The child is a descendant of the node and none of its current children are ancestors of the child
  private addNewChild(child: TAbstractFile): void {
    // Get the next generation of child from file to child, add that, then add the child
    //console.debug(`Adding ${child.path} to ${this.value.path}`);
    const nextGen = FSTraversalNode.getNextGeneration(this.value, child);
    const nextGenNode = new FSTraversalNode(nextGen);
    this.children.push(nextGenNode);
    nextGenNode.add(child);
  }

  private static getNextGeneration(
    ancestor: TAbstractFile,
    child: TAbstractFile
  ): TAbstractFile {
    if (ancestor === child) {
      throw new Error(`Ancestor and child are the same: ${ancestor.path}`);
    } else if (!FSTraversalNode.isDescendant(ancestor, child)) {
      throw new Error(
        `Child ${child.path} is not a descendant of ${ancestor.path}`
      );
    }
    if (child.parent === ancestor) {
      return child;
    } else {
      if (child.parent) {
        return FSTraversalNode.getNextGeneration(ancestor, child.parent);
      } else {
        throw new Error(`Child ${child.path} has no parent`);
      }
    }
  }
  private static isDescendant(
    ancestor: TAbstractFile,
    child: TAbstractFile
  ): boolean {
    // If the ancestor is root, then the child is a descendant
    if (ancestor.path === '/') {
      return true;
    }
    if (ancestor === child.parent) {
      return true;
    }
    if (child.parent) {
      return FSTraversalNode.isDescendant(ancestor, child.parent);
    } else {
      return false;
    }
  }
}

// Goes through the obsidian vault and linerizes the folder structure
export class FSTraverser {
  private vault: Vault;
  constructor(vault: Vault) {
    this.vault = vault;
  }

  public traverse(): FSTraversalNode {
    const root = new FSTraversalNode(this.vault.getRoot());
    this.vault.getAllLoadedFiles().forEach((file: TAbstractFile) => {
      root.add(file);
    });
    return root;
  }
}

export class FSTraversalOperators {
  public static filterFiles(node: FSTraversalNode): FSTraversalNode {
    node.removeIf((node: TAbstractFile) => {
      return node instanceof TFile;
    });
    return node;
  }

  public static filter(
    node: FSTraversalNode,
    pred: (node: TAbstractFile) => boolean
  ): FSTraversalNode {
    node.removeIf((node: TAbstractFile) => !pred(node));
    return node;
  }

  public static prettyPrintWithTabs(node: FSTraversalNode): string {
    let output = '';
    node.prefixTraverse((node: TAbstractFile) => {
      // Get the depth of the node
      const depth = node.path.split('/').length;
      // Add the appropriate number of tabs
      output += '\t'.repeat(depth);
      // Add the node name
      output += node.name;
      // Add a newline
      output += '\n';
    });
    return output;
  }

  public static prettyPrint(node: FSTraversalNode): string {
    let output = '';
    node.prefixTraverse((node: TAbstractFile) => {
      output += node instanceof TFolder ? node.path : `\t${node.name}`;
      output += '\n';
    });
    return output;
  }
}
