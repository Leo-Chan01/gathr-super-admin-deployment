'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Search,
  X
} from 'lucide-react'
import AvatarIllustration from '../dashboard/AvatarIllustration'
import avatarStyles from '../dashboard/AvatarIllustration.module.css'
import KYCDetailDrawer from '../dashboard/KYCDetailDrawer'
import MetricCards from '../dashboard/MetricCards'
import type { KYCItem } from '../dashboard/KYCCard'
import { ErrorState, InlineSpinner, SkeletonRows } from '../common/AsyncState'
import {
  approveKyc,
  getUserStats,
  listPendingKyc,
  listUsers,
  rejectKyc,
  updateUserStatus
} from '../../lib/api/admin'
import RestrictUserDialog, { type Restriction } from './RestrictUserDialog'
import {
  accountStatus,
  toKycItem,
  toUserMetrics,
  toUserRow,
  type AccountStatus,
  type UserRow
} from '../../lib/api/adapters'
import { errorMessage } from '../../lib/api/client'
import type { PageMeta, UserStatus } from '../../lib/api/types'
import { useDebounced, useResource } from '../../lib/hooks/useResource'
import { useTabIndicator } from '../motion/useMotion'
import styles from './UsersBoard.module.css'

type UserTab = 'individuals' | 'organizations' | 'pending'
type StatusFilter = 'all' | 'ACTIVE' | 'BANNED' | 'SUSPENDED'
type CategoryFilter = 'all' | 'for-profit' | 'non-profit'
type UserFilter = StatusFilter | CategoryFilter

const tabOrder: UserTab[] = ['individuals', 'organizations', 'pending']

const tabs: { key: UserTab; label: string }[] = [
  { key: 'individuals', label: 'Individuals' },
  { key: 'organizations', label: 'Organizations' },
  { key: 'pending', label: 'Pending verification' }
]

const statusFilters: { value: UserFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'BANNED', label: 'Banned' },
  { value: 'SUSPENDED', label: 'Suspended' }
]

const categoryFilters: { value: UserFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'for-profit', label: 'For-profit' },
  { value: 'non-profit', label: 'Non-profit' }
]

const categoryLabel: Record<'for-profit' | 'non-profit', string> = {
  'for-profit': 'For-profit',
  'non-profit': 'Non-profit'
}


const pageSizeFor = (tab: UserTab) => (tab === 'individuals' ? 12 : 10)

const isTab = (value: string | null): value is UserTab => tabOrder.includes(value as UserTab)

interface TableData {
  tab: UserTab
  rows: UserRow[]
  meta: PageMeta
}

interface PendingData {
  rows: KYCItem[]
  meta: PageMeta
}

export const UsersBoard: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab')
  const [tab, setTab] = useState<UserTab>(isTab(initialTab) ? initialTab : 'individuals')
  const [direction, setDirection] = useState<1 | -1>(1)
  const { tabsRef, indicator } = useTabIndicator(tab)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<UserFilter>('all')
  const [page, setPage] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [pendingToggle, setPendingToggle] = useState<string | null>(null)
  const [decidingId, setDecidingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedKyc, setSelectedKyc] = useState<KYCItem | null>(null)
  const [restricting, setRestricting] = useState<UserRow | null>(null)
  const search = useDebounced(query.trim())

  const filterOptions = tab === 'pending' ? categoryFilters : statusFilters
  const activeFilter = filterOptions.find((option) => option.value === filter) ?? filterOptions[0]
  const pageSize = pageSizeFor(tab)

  const stats = useResource((signal) => getUserStats({ signal }).then(toUserMetrics), [])

  // Individuals + organizations: server-side search, status filter and paging.
  const users = useResource<TableData | null>(
    async (signal) => {
      if (tab === 'pending') return null
      const result = await listUsers(
        {
          page,
          limit: pageSize,
          category: tab === 'individuals' ? 'INDIVIDUAL' : 'ORGANIZATION',
          status: filter === 'all' ? undefined : (filter as UserStatus),
          search: search || undefined
        },
        { signal }
      )
      return { tab, rows: result.items.map(toUserRow), meta: result.meta }
    },
    [tab, page, filter, search, pageSize]
  )

  // Pending verification: the KYC queue has no search/category params, so
  // those filters apply to the loaded page only.
  const pending = useResource<PendingData | null>(
    async (signal) => {
      if (tab !== 'pending') return null
      const result = await listPendingKyc({ page, limit: pageSize }, { signal })
      return { rows: result.items.map(toKycItem), meta: result.meta }
    },
    [tab, page, pageSize]
  )

  const pendingRows = useMemo(() => {
    const rows = pending.data?.rows ?? []
    const normalized = search.toLowerCase()
    return rows.filter((row) => {
      if (filter === 'for-profit' && row.category !== 'For-profit') return false
      if (filter === 'non-profit' && row.category !== 'Non-profit') return false
      if (!normalized) return true
      return `${row.name} ${row.email ?? ''}`.toLowerCase().includes(normalized)
    })
  }, [pending.data, filter, search])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('[data-menu-root]')) return
      setFilterOpen(false)
      setMenuId(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const active = tab === 'pending' ? pending : users
  const meta = active.data?.meta
  const totalPages = meta?.totalPages ?? 1
  const visibleCount = tab === 'pending' ? pendingRows.length : users.data?.rows.length ?? 0
  const currentPage = Math.min(page, totalPages)
    // Show skeletons until data for *this* tab arrives (users resource is shared by two tabs).
  const usersStale = tab !== 'pending' && users.data?.tab !== tab
  const initialLoading = active.loading && (!active.data || usersStale)
  const userRows = usersStale ? [] : users.data?.rows ?? []

  const changeTab = (next: UserTab) => {
    if (next === tab) return
    setDirection(tabOrder.indexOf(next) > tabOrder.indexOf(tab) ? 1 : -1)
    setTab(next)
    setQuery('')
    setFilter('all')
    setPage(1)
    setFilterOpen(false)
    setMenuId(null)
    setActionError(null)
    router.replace(next === 'individuals' ? '/users' : `/users?tab=${next}`, { scroll: false })
  }

  const patchRow = (id: string, patch: Partial<UserRow>) =>
    users.mutate((current) =>
      current ? { ...current, rows: current.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)) } : current
    )

  const statusPatch = (status: UserStatus): Partial<UserRow> => {
    const view = accountStatus(status)
    return { rawStatus: status, status: view, blocked: view === 'blocked' || view === 'suspended' }
  }

  /** Toggle on → ask Ban or Suspend. Toggle off → reinstate immediately. */
  const toggleBlocked = async (row: UserRow) => {
    if (pendingToggle) return
    if (!row.blocked) {
      setRestricting(row)
      return
    }
    const previous = { blocked: row.blocked, status: row.status, rawStatus: row.rawStatus }
    setPendingToggle(row.id)
    setActionError(null)
    // Optimistic; roll back on failure.
    patchRow(row.id, statusPatch('ACTIVE'))
    try {
      await updateUserStatus(row.id, 'ACTIVE')
      stats.reload()
    } catch (err) {
      patchRow(row.id, previous)
      setActionError(`Couldn't reinstate ${row.name}: ${errorMessage(err)}`)
    } finally {
      setPendingToggle(null)
    }
  }

  /** Called by the dialog; errors propagate so the dialog can show them. */
  const restrict = async (status: Restriction) => {
    if (!restricting) return
    await updateUserStatus(restricting.id, status)
    patchRow(restricting.id, statusPatch(status))
    stats.reload()
  }

  const removePending = (id: string) => {
    pending.mutate((current) =>
      current
        ? {
            rows: current.rows.filter((row) => String(row.id) !== id),
            meta: { ...current.meta, totalItems: Math.max(0, current.meta.totalItems - 1) }
          }
        : current
    )
    stats.reload()
  }

  const decide = async (item: KYCItem, decision: 'approve' | 'reject', reason?: string) => {
    const id = String(item.id)
    if (decision === 'approve') await approveKyc(id)
    else await rejectKyc(id, reason ?? 'Verification rejected')
    removePending(id)
  }

  /** Inline Accept from the table row (Reject needs a reason, so it opens the drawer). */
  const acceptInline = async (item: KYCItem) => {
    const id = String(item.id)
    setDecidingId(id)
    setActionError(null)
    try {
      await decide(item, 'approve')
    } catch (err) {
      setActionError(`Couldn't approve ${item.name}: ${errorMessage(err)}`)
    } finally {
      setDecidingId(null)
    }
  }

  const newLabel = tab === 'individuals' ? 'New user' : 'New org'
  const rowOffset = (currentPage - 1) * pageSize

  return (
    <>
      {stats.error && <ErrorState message={stats.error} onRetry={stats.reload} compact />}
      <MetricCards metrics={stats.data ?? toUserMetrics(undefined)} loading={stats.loading && !stats.data} />

      <section className={styles.board}>
        <div className={styles.tabs} role="tablist" aria-label="User groups" ref={tabsRef}>
          {indicator.ready && (
            <span
              className={styles.tabIndicator}
              style={{
                width: indicator.width,
                transform: `translateX(${indicator.x}px)`
              }}
            />
          )}
          {tabs.map((item) => {
            const isActive = tab === item.key
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                onClick={() => changeTab(item.key)}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <div className={styles.toolbar}>
          <label className={styles.search}>
            <span className={styles.srOnly}>Search</span>
            <input
              type="search"
              value={query}
              placeholder="Search"
              className={styles.searchInput}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
            <Search className={styles.searchIcon} />
          </label>

          <div className={styles.toolbarActions}>
            <div className={styles.filter} data-menu-root>
              <button
                type="button"
                className={styles.filterButton}
                aria-haspopup="listbox"
                aria-expanded={filterOpen}
                onClick={() => {
                  setFilterOpen((open) => !open)
                  setMenuId(null)
                }}
              >
                <span>{activeFilter.label}</span>
                <ChevronDown className={styles.filterIcon} />
              </button>
              {filterOpen && (
                <ul className={styles.menu} role="listbox" aria-label="Filter users">
                  {filterOptions.map((option) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={option.value === filter}
                        className={`${styles.menuItem} ${
                          option.value === filter ? styles.menuItemActive : ''
                        }`}
                        onClick={() => {
                          setFilter(option.value)
                          setPage(1)
                          setFilterOpen(false)
                        }}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {tab !== 'pending' && (
              <button type="button" className={styles.newButton}>
                <Plus className={styles.plusIcon} />
                {newLabel}
              </button>
            )}
          </div>
        </div>

        {actionError && <ErrorState message={actionError} compact />}

        <div className={styles.tableWrap}>
          <div key={tab} className={`${styles.pane} ${direction < 0 ? styles.paneBack : ''}`}>
            {active.error ? (
              <ErrorState message={active.error} onRetry={active.reload} />
            ) : (
              <>
                {tab === 'individuals' && (
                  <IndividualsTable
                    rows={userRows}
                    loading={initialLoading}
                    rowOffset={rowOffset}
                    pageSize={pageSize}
                    menuId={menuId}
                    pendingToggle={pendingToggle}
                    onToggle={toggleBlocked}
                    onMenu={setMenuId}
                  />
                )}
                {tab === 'organizations' && (
                  <OrganizationsTable
                    rows={userRows}
                    loading={initialLoading}
                    rowOffset={rowOffset}
                    pageSize={pageSize}
                    menuId={menuId}
                    pendingToggle={pendingToggle}
                    onToggle={toggleBlocked}
                    onMenu={setMenuId}
                  />
                )}
                {tab === 'pending' && (
                  <PendingTable
                    rows={pendingRows}
                    loading={initialLoading}
                    rowOffset={rowOffset}
                    pageSize={pageSize}
                    decidingId={decidingId}
                    onView={setSelectedKyc}
                    onAccept={acceptInline}
                    onReject={setSelectedKyc}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className={styles.footer}>
            <span className={styles.showing}>
              Showing {visibleCount} of {meta.totalItems.toLocaleString('en-US')} items
            </span>
            <div className={styles.pager}>
              <button
                type="button"
                className={styles.pageArrow}
                aria-label="Previous page"
                disabled={currentPage === 1 || active.loading}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft className={styles.pageIcon} />
              </button>
              {pageWindow(currentPage, totalPages).map((pageNumber, index) =>
                pageNumber === null ? (
                  <span key={`gap-${index}`} className={styles.pageNumber} aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    key={pageNumber}
                    type="button"
                    className={`${styles.pageNumber} ${pageNumber === currentPage ? styles.pageNumberActive : ''}`}
                    aria-current={pageNumber === currentPage ? 'page' : undefined}
                    disabled={active.loading}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                )
              )}
              <button
                type="button"
                className={styles.pageArrow}
                aria-label="Next page"
                disabled={currentPage === totalPages || active.loading}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight className={styles.pageIcon} />
              </button>
            </div>
          </div>
        )}

        <RestrictUserDialog
          userName={restricting?.name ?? null}
          onClose={() => setRestricting(null)}
          onConfirm={restrict}
        />

        <KYCDetailDrawer
          isOpen={Boolean(selectedKyc)}
          item={selectedKyc}
          onClose={() => setSelectedKyc(null)}
          onAccept={(item) => decide(item, 'approve')}
          onReject={(item, reason) => decide(item, 'reject', reason)}
        />
      </section>
    </>
  )
}

/** Page numbers with gaps, e.g. 1 … 4 5 6 … 20 */
const pageWindow = (current: number, total: number): (number | null)[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]))
}

const statusLabel: Record<AccountStatus, string> = {
  active: 'Active',
  blocked: 'Blocked',
  suspended: 'Suspended',
  inactive: 'Inactive',
  pending: 'Pending'
}

const dotClass: Record<AccountStatus, string> = {
  active: styles.dotActive,
  blocked: styles.dotBlocked,
  suspended: styles.dotSuspended,
  inactive: styles.dotInactive,
  pending: styles.dotPending
}

const StatusBadge: React.FC<{ status: AccountStatus }> = ({ status }) => (
  <span className={styles.status}>
    <span className={`${styles.statusDot} ${dotClass[status]}`} />
    {statusLabel[status]}
  </span>
)

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => (
  <span className={`${styles.category} ${category === 'For-profit' ? styles.forProfit : styles.nonProfit}`}>
    {category}
  </span>
)

const BlockToggle: React.FC<{ blocked: boolean; label: string; busy: boolean; onToggle: () => void }> = ({
  blocked,
  label,
  busy,
  onToggle
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={blocked}
    aria-label={label}
    aria-busy={busy}
    disabled={busy}
    className={`${styles.toggle} ${blocked ? styles.toggleOn : styles.toggleOff} ${busy ? styles.toggleBusy : ''}`}
    onClick={onToggle}
  >
    <span className={styles.knob}>{blocked ? <Check className={styles.knobIcon} /> : <X className={styles.knobIcon} />}</span>
  </button>
)

const RowMenu: React.FC<{ id: string; href: string; open: boolean; onToggle: () => void }> = ({
  id,
  href,
  open,
  onToggle
}) => (
  <div className={styles.rowMenu} data-menu-root>
    <button
      type="button"
      className={styles.moreButton}
      aria-label={`Actions for ${id}`}
      aria-expanded={open}
      onClick={onToggle}
    >
      <MoreHorizontal className={styles.moreIcon} />
    </button>
    {open && (
      <div className={styles.rowMenuList}>
        <Link href={href} className={styles.rowMenuLink}>
          View profile
        </Link>
      </div>
    )}
  </div>
)

const EmptyRow: React.FC<{ colSpan: number; text?: string }> = ({ colSpan, text = 'No users match this view.' }) => (
  <tr>
    <td className={styles.empty} colSpan={colSpan}>
      {text}
    </td>
  </tr>
)

interface UserTableProps {
  rows: UserRow[]
  loading: boolean
  rowOffset: number
  pageSize: number
  menuId: string | null
  pendingToggle: string | null
  onToggle: (row: UserRow) => void
  onMenu: (id: string | null) => void
}

const IndividualsTable: React.FC<UserTableProps> = ({
  rows,
  loading,
  rowOffset,
  pageSize,
  menuId,
  pendingToggle,
  onToggle,
  onMenu
}) => (
  <table className={`${styles.table} ${styles.individualsTable}`}>
    <thead>
      <tr>
        <th>User No</th>
        <th>User ID</th>
        <th>Phone</th>
        <th>Emails</th>
        <th>Joined Date</th>
        <th>Status</th>
        <th className={styles.centerHead}>Block User</th>
        <th className={styles.centerHead}>Actions</th>
      </tr>
    </thead>
    <tbody>
      {loading && <SkeletonRows rows={pageSize} columns={8} />}
      {!loading && rows.length === 0 && <EmptyRow colSpan={8} />}
      {rows.map((user, index) => (
        <tr key={user.id}>
          <td>{rowOffset + index + 1}</td>
          <td className={styles.strong}>{user.name}</td>
          <td>{user.phone}</td>
          <td>{user.email}</td>
          <td>{user.joined}</td>
          <td>
            <StatusBadge status={user.status} />
          </td>
          <td className={styles.centerCell}>
            <BlockToggle
              blocked={user.blocked}
              busy={pendingToggle === user.id}
              label={`${user.blocked ? 'Reinstate' : 'Ban or suspend'} ${user.name}`}
              onToggle={() => onToggle(user)}
            />
          </td>
          <td className={styles.centerCell}>
            <RowMenu
              id={user.name}
              href={`/users/${user.id}`}
              open={menuId === user.id}
              onToggle={() => onMenu(menuId === user.id ? null : user.id)}
            />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)

const OrganizationsTable: React.FC<UserTableProps> = ({
  rows,
  loading,
  rowOffset,
  pageSize,
  menuId,
  pendingToggle,
  onToggle,
  onMenu
}) => (
  <table className={`${styles.table} ${styles.organizationsTable}`}>
    <thead>
      <tr>
        <th>ID</th>
        <th>Organization</th>
        <th>Category</th>
        <th>Emails</th>
        <th>Joined Date</th>
        <th>Status</th>
        <th className={styles.centerHead}>Block User</th>
        <th className={styles.centerHead}>Actions</th>
      </tr>
    </thead>
    <tbody>
      {loading && <SkeletonRows rows={pageSize} columns={8} />}
      {!loading && rows.length === 0 && <EmptyRow colSpan={8} />}
      {rows.map((org, index) => (
        <tr key={org.id}>
          <td>{rowOffset + index + 1}</td>
          <td>
            <span className={styles.orgCell}>
              <AvatarIllustration className={avatarStyles.compact} />
              <span className={styles.strong}>{org.name}</span>
            </span>
          </td>
          <td>
            <CategoryBadge category={categoryLabel[org.category]} />
          </td>
          <td>{org.email}</td>
          <td>{org.joined}</td>
          <td>
            <StatusBadge status={org.status} />
          </td>
          <td className={styles.centerCell}>
            <BlockToggle
              blocked={org.blocked}
              busy={pendingToggle === org.id}
              label={`${org.blocked ? 'Reinstate' : 'Ban or suspend'} ${org.name}`}
              onToggle={() => onToggle(org)}
            />
          </td>
          <td className={styles.centerCell}>
            <RowMenu
              id={org.name}
              href={`/users/${org.id}`}
              open={menuId === org.id}
              onToggle={() => onMenu(menuId === org.id ? null : org.id)}
            />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)

const PendingTable: React.FC<{
  rows: KYCItem[]
  loading: boolean
  rowOffset: number
  pageSize: number
  decidingId: string | null
  onView: (item: KYCItem) => void
  onAccept: (item: KYCItem) => void
  onReject: (item: KYCItem) => void
}> = ({ rows, loading, rowOffset, pageSize, decidingId, onView, onAccept, onReject }) => (
  <table className={`${styles.table} ${styles.pendingTable}`}>
    <thead>
      <tr>
        <th>ID</th>
        <th>Organization</th>
        <th>Category</th>
        <th>Emails</th>
        <th>Submitted</th>
        <th>Documents</th>
        <th className={styles.actionsHead}>Actions</th>
      </tr>
    </thead>
    <tbody>
      {loading && <SkeletonRows rows={pageSize} columns={7} />}
      {!loading && rows.length === 0 && <EmptyRow colSpan={7} text="No verifications waiting for review." />}
      {rows.map((org, index) => {
        const deciding = decidingId === String(org.id)
        return (
          <tr key={org.id}>
            <td>{rowOffset + index + 1}</td>
            <td>
              <span className={styles.orgCell}>
                <AvatarIllustration className={avatarStyles.compact} />
                <span className={styles.strong}>{org.name}</span>
              </span>
            </td>
            <td>
              <CategoryBadge category={org.category} />
            </td>
            <td>{org.email ?? '—'}</td>
            <td>{org.timeAgo || '—'}</td>
            <td>
              <button type="button" className={styles.viewButton} onClick={() => onView(org)}>
                View ({org.docsSubmitted})
                <ExternalLink className={styles.viewIcon} />
              </button>
            </td>
            <td>
              <span className={styles.decisionActions}>
                <button
                  type="button"
                  className={styles.rejectButton}
                  onClick={() => onReject(org)}
                  disabled={deciding}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className={styles.acceptButton}
                  onClick={() => onAccept(org)}
                  disabled={deciding || (org.details?.kind === 'organization' && !org.details.hasSubmission)}
                  title={
                    org.details?.kind === 'organization' && !org.details.hasSubmission
                      ? 'Nothing has been submitted for review yet'
                      : undefined
                  }
                >
                  {deciding ? <InlineSpinner /> : 'Accept'}
                </button>
              </span>
            </td>
          </tr>
        )
      })}
    </tbody>
  </table>
)

export default UsersBoard
