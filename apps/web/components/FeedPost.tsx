import type { ReactNode } from "react";

/** Verified-style badge for official society/platform accounts in the feed. */
function VerifiedBadge() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="15"
      height="15"
      aria-label="Official account"
      role="img"
      className="shrink-0"
    >
      <path
        d="M10 1.5 12 3.4l2.7-.5.6 2.7 2.4 1.3-1 2.6 1 2.6-2.4 1.3-.6 2.7-2.7-.5-2 1.9-2-1.9-2.7.5-.6-2.7L1.3 12l1-2.6-1-2.6L3.7 5.6l.6-2.7 2.7.5z"
        fill="#3D6BFF"
      />
      <path
        d="m7 10.2 2 2 4-4.2"
        stroke="#fff"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The social-feed post shell: avatar, author row, body, action bar. Server-renderable;
 * interactive bits (cheer/share) are passed in as client children.
 */
export function FeedPost({
  avatar,
  author,
  verified = false,
  meta,
  pinned = false,
  children,
  actions,
}: {
  avatar: ReactNode;
  author: string;
  verified?: boolean;
  meta: string;
  pinned?: boolean;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <article className="card card-hover overflow-hidden p-0">
      {pinned && (
        <div className="bg-royal-500 px-5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
          Pinned
        </div>
      )}
      <div className="flex items-center gap-3 px-5 pb-3 pt-4">
        <div className="shrink-0">{avatar}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-extrabold text-ink">{author}</span>
            {verified && <VerifiedBadge />}
          </div>
          <div className="text-xs font-semibold text-ink/45">{meta}</div>
        </div>
      </div>
      <div className="px-5 pb-4">{children}</div>
      {actions && (
        <div className="flex flex-wrap items-center gap-1 border-t border-royal-50 px-3 py-1.5">
          {actions}
        </div>
      )}
    </article>
  );
}
