/** Tells the newest of a row of requests from those it replaced. */
export interface Latest {
  /** Starts a request. The answer says whether it is still the newest one. */
  begin: () => () => boolean;
  /** Makes every request begun so far a replaced one. */
  drop: () => void;
}

export function latest(): Latest {
  let begun = 0;
  return {
    begin: () => {
      const mine = ++begun;
      return () => mine === begun;
    },
    drop: () => {
      begun += 1;
    },
  };
}
