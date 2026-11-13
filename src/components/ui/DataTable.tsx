"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { TableSkeleton } from "./Skeleton";
import { cn } from "@/lib/utils";

export interface DataColumn<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  className?: string;
  render: (row: T) => React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchPlaceholder = "Tìm kiếm trong bảng...",
  searchFilter,
  toolbarExtra,
  loading = false,
  emptyTitle = "Chưa có bản ghi nào",
  emptyDescription = "Dữ liệu sẽ tự động hiển thị khi có phát sinh thực tế trong CSDL.",
  className,
}: {
  data: T[];
  columns: DataColumn<T>[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  toolbarExtra?: React.ReactNode;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchFilter) return data;
    return data.filter((row) => searchFilter(row, q));
  }, [data, query, searchFilter]);

  if (loading) {
    return <TableSkeleton rows={5} />;
  }

  return (
    <div
      className={cn(
        "rounded-panel bg-surface border border-border shadow-card overflow-hidden",
        className
      )}
    >
      {(searchFilter || toolbarExtra) && (
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-canvas/50">
          {searchFilter && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 rounded-button bg-surface border border-border focus:border-ocean-600 focus:ring-2 focus:ring-ocean-light text-xs text-ink outline-none transition-all"
              />
            </div>
          )}
          {toolbarExtra && (
            <div className="flex flex-wrap items-center gap-2">{toolbarExtra}</div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="p-6">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-muted/75 border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 whitespace-nowrap",
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left",
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {filtered.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="hover:bg-ocean-50/45 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 align-middle text-ink",
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left",
                        col.className
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

