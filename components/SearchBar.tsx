"use client";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  totalLoaded: number;
  hasMore: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
};

export default function SearchBar({
  query,
  onQueryChange,
  totalLoaded,
  hasMore,
  onLoadMore,
  loadingMore,
}: Props) {
  return (
    <div className="panel space-y-2">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by endangered-language word or English translation…"
          className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
        />
        <button type="button" onClick={() => onQueryChange("")} className="rounded bg-slate-700 px-3 py-2">
          Clear
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <p>
          {totalLoaded === 0
            ? "No entries loaded yet."
            : `${totalLoaded} entr${totalLoaded === 1 ? "y" : "ies"} shown`}
          {hasMore ? ` · More available — use “Load more”.` : totalLoaded ? ` · End of dictionary for this query.` : null}
        </p>
        {hasMore ? (
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => onLoadMore?.()}
            className="rounded bg-slate-800 px-3 py-1.5 text-slate-200 hover:bg-slate-700 disabled:opacity-40"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
