import { Editor } from 'obsidian';

export const moveToEndOfFile = (editor: Editor) => {
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  editor.setCursor({
    line: cursor.line,
    ch: line.length,
  });
};

export const moveToEndOfLine = (editor: Editor) => {
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  editor.setCursor({
    line: cursor.line,
    ch: line.length,
  });
};
