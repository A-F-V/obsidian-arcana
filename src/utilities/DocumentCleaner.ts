export function removeFrontMatter(text: string): string {
  // Check if the text has front matter
  if (!text.startsWith('---')) {
    return text;
  }
  // Remove the front matter from just the start of the text
  const lines = text.split('\n');
  let i = 1;
  for (; i < lines.length; i++) {
    if (lines[i].startsWith('---')) {
      break;
    }
  }
  return lines.slice(i + 1).join('\n');
}

export function surroundWithMarkdown(text: string): string {
  return `\`\`\`md\n${text}\`\`\``;
}
