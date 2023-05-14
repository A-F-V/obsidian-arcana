import Aborter from './Aborter';

export default class AbortableTokenHandler {
  private aborter: Aborter;
  private handler: (token: string) => void;

  constructor(aborter: Aborter, handler: (token: string) => void) {
    this.aborter = aborter;
    this.handler = handler;
  }
}
