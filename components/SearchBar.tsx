"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  placeholder?: string;
  query: string;
  onQueryChange: (value: string) => void;
  totalLoaded: number;
  hasMore: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
};

export default function SearchBar({
  placeholder = "Search by endangered-language word or English translation…",
  query,
  onQueryChange,
  totalLoaded,
  hasMore,
  onLoadMore,
  loadingMore,
}: Props) {
  return (
    <div className="panel space-y-3">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 border-[#C3C8C1] bg-[#FBF9F4] text-[#1B1C19]"
        />
        <Button type="button" variant="outline" onClick={() => onQueryChange("")} className="rounded-xl">
          Clear
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#434843]">
        <p>
          {totalLoaded === 0
            ? "No entries loaded yet."
            : `${totalLoaded} entr${totalLoaded === 1 ? "y" : "ies"} shown`}
          {hasMore ? ` · More available — use “Load more”.` : totalLoaded ? ` · End of dictionary for this query.` : null}
        </p>
        {hasMore ? (
          <Button
            type="button"
            variant="pill"
            size="sm"
            disabled={loadingMore}
            onClick={() => onLoadMore?.()}
            className="disabled:opacity-40"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
