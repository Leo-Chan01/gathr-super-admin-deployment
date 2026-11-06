"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import FlaggedCard, { FlaggedItem } from "../dashboard/FlaggedCard";
import MetricCards from "../dashboard/MetricCards";
import ReportReviewDrawer from "./ReportReviewDrawer";
import { ErrorState, SkeletonGrid } from "../common/AsyncState";
import { useReflow } from "../motion/useMotion";
import { getReportStats, listReports, reviewReport } from "../../lib/api/admin";
import { toReportItem, toReportMetrics } from "../../lib/api/adapters";
import { errorMessage } from "../../lib/api/client";
import type { ReportStatus } from "../../lib/api/types";
import { useDebounced, useResource } from "../../lib/hooks/useResource";
import styles from "./ReportsQueue.module.css";

type StatusFilter = "all" | ReportStatus;

const filters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "OPEN", label: "Pending review" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "DISMISSED", label: "Dismissed" },
  { value: "REMOVED", label: "Removed" },
];

const PAGE_SIZE = 12;

export const ReportsQueue: React.FC = () => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("OPEN");
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const beginRemove = useReflow(gridRef);
  const search = useDebounced(query.trim());

  const stats = useResource((signal) => getReportStats({ signal }).then(toReportMetrics), []);
  const reports = useResource(
    (signal) =>
      listReports(
        { page, limit: PAGE_SIZE, search: search || undefined, status: status === "all" ? undefined : status },
        { signal }
      ).then((result) => ({ items: result.items.map(toReportItem), meta: result.meta })),
    [page, search, status]
  );

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const activeFilter = filters.find((filter) => filter.value === status) ?? filters[0];
  const items = reports.data?.items ?? [];
  const meta = reports.data?.meta;

  /** After a review: drop the card if it no longer matches the filter, else update its status. */
  const applyReview = (id: string, next: ReportStatus) => {
    const leaves = status !== "all" && status !== next;
    if (leaves) beginRemove(id);
    reports.mutate((current) =>
      current
        ? {
            meta: leaves ? { ...current.meta, totalItems: Math.max(0, current.meta.totalItems - 1) } : current.meta,
            items: leaves
              ? current.items.filter((item) => item.id !== id)
              : current.items.map((item) => (item.id === id ? { ...item, status: next } : item)),
          }
        : current
    );
    stats.reload();
  };

  const handleDismiss = async (item: FlaggedItem) => {
    const id = String(item.id);
    setBusyId(id);
    setActionError(null);
    try {
      await reviewReport(id, "DISMISSED", "Dismissed from reports queue");
      applyReview(id, "DISMISSED");
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {stats.error && <ErrorState message={stats.error} onRetry={stats.reload} compact />}
      <MetricCards metrics={stats.data ?? toReportMetrics(undefined)} loading={stats.loading && !stats.data} />

      <section className={styles.section}>
        <div className={styles.toolbar}>
          <label className={styles.search}>
            <span className={styles.srOnly}>Search reporter</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search reporter"
              className={styles.searchInput}
            />
            <Search className={styles.searchIcon} />
          </label>

          <div className={styles.filter} ref={filterRef}>
            <button
              type="button"
              className={styles.filterButton}
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span>{activeFilter.label}</span>
              <ChevronDown className={styles.filterIcon} />
            </button>
            {menuOpen && (
              <ul className={styles.menu} role="listbox" aria-label="Report status">
                {filters.map((filter) => (
                  <li key={filter.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={filter.value === status}
                      className={`${styles.menuItem} ${filter.value === status ? styles.menuItemActive : ""}`}
                      onClick={() => {
                        setStatus(filter.value);
                        setPage(1);
                        setMenuOpen(false);
                      }}
                    >
                      {filter.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {actionError && <ErrorState message={actionError} compact />}

        {reports.error ? (
          <ErrorState message={reports.error} onRetry={reports.reload} />
        ) : reports.loading && !reports.data ? (
          <SkeletonGrid count={6} className={styles.grid} height={200} />
        ) : items.length > 0 ? (
          <div className={styles.grid} ref={gridRef} aria-busy={reports.loading}>
            {items.map((item) => (
              <div key={item.id} data-flip-id={String(item.id)} className={styles.flipItem}>
                <FlaggedCard
                  item={item}
                  busy={busyId === String(item.id)}
                  onDismiss={item.status === "OPEN" ? handleDismiss : undefined}
                  onReview={(entry) => setReviewId(String(entry.id))}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No reports match this view.</p>
        )}

        {meta && meta.totalPages > 1 && (
          <div className={styles.footer}>
            <span className={styles.showing}>
              Page {meta.page} of {meta.totalPages} · {meta.totalItems.toLocaleString("en-US")} reports
            </span>
            <div className={styles.pager}>
              <button
                type="button"
                className={styles.pageArrow}
                aria-label="Previous page"
                disabled={page <= 1 || reports.loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                className={styles.pageArrow}
                aria-label="Next page"
                disabled={page >= meta.totalPages || reports.loading}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </section>

      <ReportReviewDrawer reportId={reviewId} onClose={() => setReviewId(null)} onReviewed={applyReview} />
    </>
  );
};

export default ReportsQueue;
