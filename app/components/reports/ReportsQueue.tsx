"use client";

import React, { useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import FlaggedCard, { FlaggedItem } from "../dashboard/FlaggedCard";
import { useReflow } from "../motion/useMotion";
import { reportItems, type ReportItem, type ReportStatus } from "./reportData";
import styles from "./ReportsQueue.module.css";

type StatusFilter = "all" | ReportStatus;

const filters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending review" },
  { value: "resolved", label: "Resolved" },
  { value: "removed", label: "Removed" },
];

export const ReportsQueue: React.FC = () => {
  const [items, setItems] = useState<ReportItem[]>(reportItems);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const beginRemove = useReflow(gridRef);

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = status === "all" || item.status === status;
      if (!matchesStatus) return false;
      if (!normalized) return true;
      const haystack =
        `${item.username ?? ""} ${item.name ?? ""} ${item.comment ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, query, status]);

  const activeFilter =
    filters.find((filter) => filter.value === status) ?? filters[0];

  const handleDismiss = (item: FlaggedItem) => {
    beginRemove(String(item.id));
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  };

  return (
    <section className={styles.section}>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className={styles.srOnly}>Search user</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="search User"
            className={styles.searchInput}
          />
          <Search className={styles.searchIcon} />
        </label>

        <div className={styles.filter}>
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
            <ul
              className={styles.menu}
              role="listbox"
              aria-label="Report status"
            >
              {filters.map((filter) => (
                <li key={filter.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={filter.value === status}
                    className={`${styles.menuItem} ${
                      filter.value === status ? styles.menuItemActive : ""
                    }`}
                    onClick={() => {
                      setStatus(filter.value);
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

      {visibleItems.length > 0 ? (
        <div className={styles.grid} ref={gridRef}>
          {visibleItems.map((item) => (
            <div key={item.id} data-flip-id={String(item.id)} className={styles.flipItem}>
              <FlaggedCard item={item} onDismiss={handleDismiss} />
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No reports match this view.</p>
      )}
    </section>
  );
};

export default ReportsQueue;
