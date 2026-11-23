/** What an error says, or `fallback` for a thrown value that is not an error. */
export const messageOf = (cause: unknown, fallback: string): string =>
  cause instanceof Error ? cause.message : fallback;
