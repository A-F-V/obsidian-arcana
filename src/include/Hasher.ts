import { createHash } from 'crypto';

export default function hash(data: string): number {
  // Simple sha256 hash
  const hash = createHash('sha256');
  hash.update(data);
  const digest = hash.digest('hex');
  // Convert to a number
  return parseInt(digest, 16);
}
