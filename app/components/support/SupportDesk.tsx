'use client'

import React, { useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, MessageSquare, Search } from 'lucide-react'
import MetricCards from '../dashboard/MetricCards'
import type { MetricItem } from '../dashboard/MetricCards'
import { ErrorState, SkeletonRows } from '../common/AsyncState'
import { useTabIndicator } from '../motion/useMotion'
import { formatCount, timeAgo } from '../../lib/api/adapters'
import {
  getTicketStats,
  listAssignees,
  listTickets,
  profileName,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type SupportTicket,
  type TicketCategory,
  type TicketPriority,
  type TicketScope,
  type TicketStats,
  type TicketStatus
} from '../../lib/api/support'
import { useDebounced, useResource } from '../../lib/hooks/useResource'
import TicketDrawer from './TicketDrawer'
import { humanize, PriorityBadge, StatusBadge } from './badges'
import board from '../users/UsersBoard.module.css'
import styles from './Support.module.css'

const scopes: { key: TicketScope; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'archived', label: 'Archived' },
  { key: 'all', label: 'All' }
]

const PAGE_SIZE = 12

const toMetrics = (stats?: TicketStats): MetricItem[] => [
  { title: 'Open', value: formatCount(stats?.open), isPositive: true, tone: 'pink' },
  { title: 'In progress', value: formatCount(stats?.inProgress), isPositive: true, tone: 'blue' },
  { title: 'Waiting on user', value: formatCount(stats?.waiting), isPositive: true, tone: 'gray' },
  { title: 'Resolved', value: formatCount(stats?.resolved), isPositive: true, tone: 'green' }
]

export const SupportDesk: React.FC = () => {
  const [scope, setScope] = useState<TicketScope>('active')
  const { tabsRef, indicator } = useTabIndicator(scope)
  const [query, setQuery] = useState('')
  const search = useDebounced(query.trim())
  const [status, setStatus] = useState<TicketStatus | 'all'>('all')
  const [priority, setPriority] = useState<TicketPriority | 'all'>('all')
  const [category, setCategory] = useState<TicketCategory | 'all'>('all')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const stats = useResource((signal) => getTicketStats({ signal }), [])
  const assignees = useResource((signal) => listAssignees({ signal }), [])
  const tickets = useResource(
    (signal) =>
      listTickets(
        {
          page,
          limit: PAGE_SIZE,
          scope,
          search: search || undefined,
          status: status === 'all' ? undefined : status,
          priority: priority === 'all' ? undefined : priority,
          category: category === 'all' ? undefined : category
        },
        { signal }
      ),
    [page, scope, search, status, priority, category]
  )

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest('[data-menu-root]')) return
      setOpenMenu(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const rows = tickets.data?.items ?? []
  const meta = tickets.data?.meta

  const resetPage = () => setPage(1)

  /** Keep the table in sync with edits made in the drawer. */
  const onTicketChange = (ticket: SupportTicket | null, removedId?: string) => {
    tickets.mutate((current) => {
      if (!current) return current
      if (removedId) {
        return {
          ...current,
          items: current.items.filter((row) => row.id !== removedId),
          meta: { ...current.meta, totalItems: Math.max(0, current.meta.totalItems - 1) }
        }
      }
      if (!ticket) return current
      return { ...current, items: current.items.map((row) => (row.id === ticket.id ? { ...row, ...ticket } : row)) }
    })
    stats.reload()
  }

  return (
    <>
      {stats.error && <ErrorState message={stats.error} onRetry={stats.reload} compact />}
      <MetricCards metrics={toMetrics(stats.data)} loading={stats.loading && !stats.data} />

      <section className={board.board}>
        <div className={board.tabs} role="tablist" aria-label="Ticket scope" ref={tabsRef}>
          {indicator.ready && (
            <span
              className={board.tabIndicator}
              style={{ width: indicator.width, transform: `translateX(${indicator.x}px)` }}
            />
          )}
          {scopes.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={scope === item.key}
              className={`${board.tab} ${scope === item.key ? board.tabActive : ''}`}
              onClick={() => {
                setScope(item.key)
                resetPage()
              }}
            >
              {item.label}
              {item.key === 'archived' && stats.data?.archived !== undefined && ` (${stats.data.archived})`}
            </button>
          ))}
        </div>

        <div className={board.toolbar}>
          <label className={board.search}>
            <span className={board.srOnly}>Search tickets</span>
            <input
              type="search"
              value={query}
              placeholder="Search subject"
              className={board.searchInput}
              onChange={(event) => {
                setQuery(event.target.value)
                resetPage()
              }}
            />
            <Search className={board.searchIcon} />
          </label>

          <div className={board.toolbarActions}>
            <FilterMenu
              id="status"
              label="Status"
              value={status}
              options={TICKET_STATUSES}
              open={openMenu === 'status'}
              onToggle={() => setOpenMenu(openMenu === 'status' ? null : 'status')}
              onChange={(value) => {
                setStatus(value)
                setOpenMenu(null)
                resetPage()
              }}
            />
            <FilterMenu
              id="priority"
              label="Priority"
              value={priority}
              options={TICKET_PRIORITIES}
              open={openMenu === 'priority'}
              onToggle={() => setOpenMenu(openMenu === 'priority' ? null : 'priority')}
              onChange={(value) => {
                setPriority(value)
                setOpenMenu(null)
                resetPage()
              }}
            />
            <FilterMenu
              id="category"
              label="Category"
              value={category}
              options={TICKET_CATEGORIES}
              open={openMenu === 'category'}
              onToggle={() => setOpenMenu(openMenu === 'category' ? null : 'category')}
              onChange={(value) => {
                setCategory(value)
                setOpenMenu(null)
                resetPage()
              }}
            />
          </div>
        </div>

        <div className={board.tableWrap}>
          {tickets.error ? (
            <ErrorState message={tickets.error} onRetry={tickets.reload} />
          ) : (
            <table className={`${board.table} ${styles.ticketTable}`}>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Requester</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.loading && !tickets.data && <SkeletonRows rows={8} columns={7} />}
                {!tickets.loading && rows.length === 0 && (
                  <tr>
                    <td className={board.empty} colSpan={7}>
                      No tickets match this view.
                    </td>
                  </tr>
                )}
                {rows.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={`${styles.ticketRow} ${selectedId === ticket.id ? styles.ticketRowActive : ''}`}
                    onClick={() => setSelectedId(ticket.id)}
                  >
                    <td>
                      <button type="button" className={styles.subjectButton} onClick={() => setSelectedId(ticket.id)}>
                        <span className={board.strong}>{ticket.subject}</span>
                        <span className={styles.messageCount}>
                          <MessageSquare aria-hidden="true" /> {ticket._count?.messages ?? 0}
                        </span>
                      </button>
                    </td>
                    <td>{profileName(ticket.requester)}</td>
                    <td>
                      <span className={styles.categoryChip}>{humanize(ticket.category)}</span>
                    </td>
                    <td>
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td>
                      <StatusBadge status={ticket.status} archived={Boolean(ticket.archivedAt)} />
                    </td>
                    <td className={ticket.assignee ? undefined : styles.muted}>{profileName(ticket.assignee)}</td>
                    <td className={styles.muted}>{timeAgo(ticket.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {meta && meta.totalPages > 1 && (
          <div className={board.footer}>
            <span className={board.showing}>
              Page {meta.page} of {meta.totalPages} · {meta.totalItems.toLocaleString('en-US')} tickets
            </span>
            <div className={board.pager}>
              <button
                type="button"
                className={board.pageArrow}
                aria-label="Previous page"
                disabled={page <= 1 || tickets.loading}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className={board.pageIcon} />
              </button>
              <button
                type="button"
                className={board.pageArrow}
                aria-label="Next page"
                disabled={page >= meta.totalPages || tickets.loading}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className={board.pageIcon} />
              </button>
            </div>
          </div>
        )}
      </section>

      <TicketDrawer
        ticketId={selectedId}
        assignees={assignees.data ?? []}
        onClose={() => setSelectedId(null)}
        onChange={onTicketChange}
      />
    </>
  )
}

function FilterMenu<T extends string>({
  id,
  label,
  value,
  options,
  open,
  onToggle,
  onChange
}: {
  id: string
  label: string
  value: T | 'all'
  options: readonly T[]
  open: boolean
  onToggle: () => void
  onChange: (value: T | 'all') => void
}) {
  return (
    <div className={board.filter} data-menu-root>
      <button
        type="button"
        className={board.filterButton}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`filter-${id}`}
        onClick={onToggle}
      >
        <span>{value === 'all' ? label : humanize(value)}</span>
        <ChevronDown className={board.filterIcon} />
      </button>
      {open && (
        <ul id={`filter-${id}`} className={board.menu} role="listbox" aria-label={label}>
          {(['all', ...options] as (T | 'all')[]).map((option) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={option === value}
                className={`${board.menuItem} ${option === value ? board.menuItemActive : ''}`}
                onClick={() => onChange(option)}
              >
                {option === 'all' ? `All ${label.toLowerCase()}` : humanize(option)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default SupportDesk
