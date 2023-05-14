export default class Aborter {
  private abortController: AbortController;

  constructor() {
    this.abortController = new AbortController();
  }

  public abort() {
    this.abortController.abort();
  }

  public isAborted(): boolean {
    return this.abortController.signal.aborted;
  }

  public reset() {
    this.abortController = new AbortController();
  }
}
