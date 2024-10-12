import ArcanaPlugin from 'src/main';
import SerializableAborter from './Aborter';
import { Editor, EditorPosition } from 'obsidian';

abstract class TokenAbortRule {
  protected aborter: SerializableAborter;
  constructor(aborter: SerializableAborter) {
    this.aborter = aborter;
  }

  public abstract preToken(token: string): void;
  public abstract postToken(token: string): void;
  public onDone() {}
}

export class AbortableTokenHandler {
  public aborter: SerializableAborter;
  private handler: (token: string) => void;
  private abortRules = new Array<TokenAbortRule>();

  constructor(aborter: SerializableAborter, handler: (token: string) => void) {
    this.aborter = aborter;
    this.handler = handler;
  }

  public addAbortRule(rule: TokenAbortRule) {
    this.abortRules.push(rule);
  }
  public handleToken(token: string) {
    this.abortRules.forEach(rule => rule.preToken(token));

    if (this.aborter.isAborted()) return;
    this.handler(token);

    this.abortRules.forEach(rule => rule.postToken(token));
  }

  public onDone() {
    this.abortRules.forEach(rule => rule.onDone());
  }
}

export class EscAbortRule extends TokenAbortRule {
  private cleanUp: () => void;
  constructor(aborter: SerializableAborter, arcana: ArcanaPlugin) {
    super(aborter);

    const escapeHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.aborter.abort();
      }
    };
    window.addEventListener('keydown', escapeHandler);

    this.cleanUp = () => {
      window.removeEventListener('keydown', escapeHandler);
      this.aborter.abort();
    };
    arcana.registerResource(this.cleanUp);
  }

  preToken(token: string): void {
    // Do nothing
  }
  postToken(token: string): void {
    // Do nothing
  }

  onDone() {
    this.cleanUp();
  }
}

export class CursorMoveAbortRule extends TokenAbortRule {
  private editor: Editor;
  private lastEditorPosition: EditorPosition | null;

  constructor(aborter: SerializableAborter, editor: Editor) {
    super(aborter);
    this.editor = editor;
  }

  preToken(token: string) {
    const currentPosition = this.editor.getCursor();
    if (this.lastEditorPosition == null) return;
    const moved =
      currentPosition.line != this.lastEditorPosition.line || currentPosition.ch != this.lastEditorPosition.ch;
    if (moved) this.aborter.abort();
  }
  postToken(token: string): void {
    this.lastEditorPosition = this.editor.getCursor();
  }
}

export class EditorAbortableTokenHandler extends AbortableTokenHandler {
  constructor(aborter: SerializableAborter, handler: (token: string) => void, editor: Editor, arcana: ArcanaPlugin) {
    super(aborter, handler);
    this.addAbortRule(new CursorMoveAbortRule(aborter, editor));
    this.addAbortRule(new EscAbortRule(aborter, arcana));
  }
}
