export const Setting = class {
  constructor(public containerEl: HTMLElement) {}
  setName(name: string) {
    return this;
  }
  setDesc(desc: string) {
    return this;
  }
  addText(callback: (text: any) => any) {
    return this;
  }
  addTextArea(callback: (text: any) => any) {
    return this;
  }
};

export const TextComponent = class {
  setValue(value: string) {
    return this;
  }
  setPlaceholder(placeholder: string) {
    return this;
  }
  onChange(callback: (value: string) => any) {
    return this;
  }
};
