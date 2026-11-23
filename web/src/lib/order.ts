/** The items from the highest key to the lowest. Items with the same key keep their order. */
export function descending<T>(items: readonly T[], key: (item: T) => number | string): T[] {
  return [...items].sort((one, other) => {
    const a = key(one);
    const b = key(other);
    return a < b ? 1 : a > b ? -1 : 0;
  });
}
