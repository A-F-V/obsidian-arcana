export class Message {
  text: string;
  author: Author;
}
export class MessageManager {
  private message: Message;
  addText(addition: string) {
    this.message.text += addition;
  }
  clearText() {
    this.message.text = '';
  }

  public constructor(message: Message) {
    this.message = message;
  }
}

export enum Author {
  AI,
  User,
}
