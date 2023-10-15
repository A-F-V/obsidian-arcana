export enum Author {
  AI,
  User,
}

export class Message {
  text: string;
  author: Author;
}
