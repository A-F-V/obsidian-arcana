export function escapeCurlyBraces(text: string): string {
  return new String(text)
    .replace(RegExp('{', 'g'), '{{')
    .replace(RegExp('}', 'g'), '}}');
}

// Returns the base name of the file at the given path
export function getBaseName(path: string): string {
  // Split the path on the forward slash or back slash characters
  const pathParts = path.split(/[\\/]/);
  // Return the last part of the path
  const basenameWithExt = pathParts.pop() || '';
  // Remove the extension
  const basename = basenameWithExt.split('.')[0];
  return basename;
}

export function isEmoji(text: string): boolean {
  // If the text is not a string of length 1, it is not an emoji
  if (text.length !== 1) return false;
  const emojiRange =
    /[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}]/u;

  return emojiRange.test(text);
}
