// Takes a markdown document and returns a hash of its contents

import * as crypto from 'crypto';

export function hashDocument(document: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(document);
  return hash.digest('hex');
}
