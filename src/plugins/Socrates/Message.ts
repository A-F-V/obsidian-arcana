export default class Message {
  text: string;
  addText(addition: string) {
    this.text += addition;
  }
  clearText() {
    this.text = '';
  }

  author: string;

  public constructor(author: string) {
    this.author = author;
    this.text = '';
  }
}
