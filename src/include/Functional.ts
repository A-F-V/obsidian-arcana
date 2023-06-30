export function findLast<T>(
  array: T[],
  predicate: (value: T) => boolean
): T | undefined {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i])) return array[i];
  }
  return undefined;
}

export function findLastIndex<T>(
  array: T[],
  predicate: (value: T) => boolean
): number {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i])) return i;
  }
  return -1;
}
