import { hrefOf, VIEWS, type ViewId } from "./route";
import { APP_NAME, VIEW_LABEL } from "./viewLabel";
import { GithubLink } from "./GithubLink";
import { Logo } from "./Logo";

/** The bar on top of every view: the name of the app, the views from the simplest to the densest, the source. */
export function TopBar({ current }: { current: ViewId }) {
  return (
    <header className="top">
      <div className="top-in">
        <a className="brand" href={hrefOf("home")}>
          <Logo />
          <span>{APP_NAME}</span>
        </a>
        <nav className="nav" aria-label="Views">
          {VIEWS.map((view) => (
            <a
              key={view}
              className={view === "home" ? "nav-home" : undefined}
              href={hrefOf(view)}
              aria-current={view === current ? "page" : undefined}
            >
              {VIEW_LABEL[view]}
            </a>
          ))}
        </nav>
        <GithubLink />
      </div>
    </header>
  );
}
