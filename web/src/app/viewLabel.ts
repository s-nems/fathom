import type { ViewId } from "./route";

export const APP_NAME = "Fathom";

export const VIEW_LABEL: Record<ViewId, string> = {
  home: "Home",
  play: "Play",
  replay: "Replay",
  arena: "Arena",
  distributions: "Distributions",
};

/** The title of the page for a view: the view first, as that is what tells one tab from another. */
export const titleOf = (view: ViewId): string => (view === "home" ? APP_NAME : `${VIEW_LABEL[view]} - ${APP_NAME}`);
