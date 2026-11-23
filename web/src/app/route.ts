export const VIEWS = ["home", "play", "replay", "arena", "distributions"] as const;
export type ViewId = (typeof VIEWS)[number];
export type RouteParams = Record<string, string>;

/** The view on screen and its parameters, as kept in the URL hash. */
export interface Route {
  view: ViewId;
  params: RouteParams;
}

const DEFAULT_VIEW: ViewId = "home";
const HASH_PREFIX = "#/";

const isView = (name: string): name is ViewId => (VIEWS as readonly string[]).includes(name);

/** Reads "#/replay?seed=3". Anything unknown falls back to the first view. */
export function parseHash(hash: string): Route {
  const [path, search = ""] = hash.replace(HASH_PREFIX, "").split("?");
  if (!isView(path)) return { view: DEFAULT_VIEW, params: {} };
  return { view: path, params: Object.fromEntries(new URLSearchParams(search)) };
}

export function formatHash(route: Route): string {
  const search = new URLSearchParams(route.params).toString();
  return HASH_PREFIX + route.view + (search ? `?${search}` : "");
}

/** The address of a view, for a link. Empty values are left out. */
export function hrefOf(view: ViewId, params: Record<string, string | undefined> = {}): string {
  const kept: RouteParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") kept[key] = value;
  }
  return formatHash({ view, params: kept });
}
