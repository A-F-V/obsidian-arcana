import { Editor } from 'obsidian';

export const moveToEndOfFile = (editor: Editor) => {
  const lastLine = editor.lastLine();
  const lastLineLength = editor.getLine(lastLine).length;
  editor.setCursor({
    line: lastLine,
    ch: lastLineLength,
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
