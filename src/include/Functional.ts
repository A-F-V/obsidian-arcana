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

export function merge<T extends object>(reference_: T | null, default_: T): T {
  // If S is null, return D
  if (reference_ === null || reference_ === undefined) {
    return default_;
  }
  // Print reference_ and default_ for debugging by stringifying them
  console.log(
    `Merging: ${JSON.stringify(reference_)} and ${JSON.stringify(default_)}`
  );

  // Create a shallow copy of source to maintain the integrity of the original object.
  const result: T = { ...reference_ };

  // Loop through all fields in D
  for (const key in default_) {
    if (default_.hasOwnProperty(key)) {
      if (!reference_.hasOwnProperty(key)) {
        result[key] = default_[key];
      }
      // If the field exists in both and is an array, overwrite with D's value
      else if (Array.isArray(default_[key]) || Array.isArray(reference_[key])) {
        result[key] = default_[key];
      }
      // If the field exists in both and is a JSON object, merge recursively
      else if (
        typeof default_[key] === 'object' &&
        default_[key] !== null &&
        typeof reference_[key] === 'object' &&
        reference_[key] !== null
      ) {
        // Ignore typing
        // @ts-ignore
        result[key] = merge(reference_[key], default_[key]);
      }
    }
  }

  return result;
}
