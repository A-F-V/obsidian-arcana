export class Message {
  text: string;
  addText(addition: string) {
    this.text += addition;
  }
  clearText() {
    this.text = '';
  }

  author: Author;

  public constructor(author: Author) {
    this.author = author;
    this.text = '';
  }
}

export enum Author {
  AI,
  User,
}
