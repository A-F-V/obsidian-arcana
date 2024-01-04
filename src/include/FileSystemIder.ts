// For each file and folder, a unique ID is generated. A two directional mapping is created between the ID and the file/folder.

import { TAbstractFile, Vault } from 'obsidian';
import { FSTraverser } from './FileSystemCrawler';

export default class FileSystemIder {
  public static async id(vault: Vault) {
    let nextId = 0;
    const idToFile: Map<number, string> = new Map();
    const fileToId: Map<string, number> = new Map();
    const traverser = new FSTraverser(vault);
    const traversal = traverser.traverse();
    traversal.prefixTraverse((node: TAbstractFile) => {
      const id = nextId;
      nextId++;
      idToFile.set(id, node.path);
      fileToId.set(node.path, id);
    });
    return { idToFile, fileToId };
  }
}
