export default class SerializableAborter {
  private aborted = false;

  constructor() {
    this.reset();
  }

  public abort() {
    this.aborted = true;
  }

  public isAborted(): boolean {
    return this.aborted;
  }

  public reset() {
    this.aborted = false;
  }
}
