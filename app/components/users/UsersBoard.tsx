'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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
import type { KYCItem } from '../dashboard/KYCCard'
import {
  categoryLabel,
  individualUsers,
  organizationUsers,
  pendingOrganizations,
  toKycItem,
  type AccountStatus,
  type IndividualUser,
  type OrganizationUser,
  type OrgCategory,
  type PendingOrganization,
  type UserFilter,
  type UserTab
} from './userData'
import { useTabIndicator } from '../motion/useMotion'
import styles from './UsersBoard.module.css'

const tabOrder: UserTab[] = ['individuals', 'organizations', 'pending']

const tabs: { key: UserTab; label: string }[] = [
  { key: 'individuals', label: 'Individuals' },
  { key: 'organizations', label: 'Organizations' },
  { key: 'pending', label: 'Pending verification' }
]

const statusFilters: { value: UserFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' }
]

const categoryFilters: { value: UserFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'for-profit', label: 'For-profit' },
  { value: 'non-profit', label: 'Non-profit' }
]

const pageSizeFor = (tab: UserTab) => (tab === 'individuals' ? 12 : 6)

const nextStatus = (blocked: boolean): AccountStatus => (blocked ? 'blocked' : 'active')

export const UsersBoard: React.FC = () => {
  const [tab, setTab] = useState<UserTab>('individuals')
  const [direction, setDirection] = useState<1 | -1>(1)
  const { tabsRef, indicator } = useTabIndicator(tab)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<UserFilter>('all')
  const [page, setPage] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [individuals, setIndividuals] = useState<IndividualUser[]>(individualUsers)
  const [organizations, setOrganizations] = useState<OrganizationUser[]>(organizationUsers)
  const [pending, setPending] = useState<PendingOrganization[]>(pendingOrganizations)
  const [selectedKyc, setSelectedKyc] = useState<KYCItem | null>(null)

  const filterOptions = tab === 'pending' ? categoryFilters : statusFilters
  const activeFilter = filterOptions.find((option) => option.value === filter) ?? filterOptions[0]

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

  const filteredIndividuals = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return individuals.filter((user) => {
      const matchesFilter = filter === 'all' || filter === user.status
      if (!matchesFilter) return false
      if (!normalized) return true
      return `${user.userNo} ${user.name} ${user.phone} ${user.email}`.toLowerCase().includes(normalized)
    })
  }, [individuals, query, filter])

  const filteredOrganizations = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return organizations.filter((org) => {
      const matchesFilter =
        filter === 'all' || filter === org.status || filter === org.category
      if (!matchesFilter) return false
      if (!normalized) return true
      return `${org.name} ${org.email} ${categoryLabel[org.category]}`.toLowerCase().includes(normalized)
    })
  }, [organizations, query, filter])

  const filteredPending = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return pending.filter((org) => {
      const matchesFilter = filter === 'all' || filter === org.category
      if (!matchesFilter) return false
      if (!normalized) return true
      return `${org.name} ${org.email} ${categoryLabel[org.category]}`.toLowerCase().includes(normalized)
    })
  }, [pending, query, filter])

  const activeRows =
    tab === 'individuals'
      ? filteredIndividuals
      : tab === 'organizations'
        ? filteredOrganizations
        : filteredPending

  const pageSize = pageSizeFor(tab)
  const totalPages = Math.max(1, Math.ceil(activeRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const visibleRows = activeRows.slice(start, start + pageSize)

  const changeTab = (next: UserTab) => {
    if (next === tab) return
    setDirection(tabOrder.indexOf(next) > tabOrder.indexOf(tab) ? 1 : -1)
    setTab(next)
    setQuery('')
    setFilter('all')
    setPage(1)
    setFilterOpen(false)
    setMenuId(null)
  }

  const toggleBlocked = (id: string, kind: 'individual' | 'organization') => {
    if (kind === 'individual') {
      setIndividuals((current) =>
        current.map((user) => {
          if (user.id !== id) return user
          const blocked = !user.blocked
          return { ...user, blocked, status: nextStatus(blocked) }
        })
      )
      return
    }

    setOrganizations((current) =>
      current.map((org) => {
        if (org.id !== id) return org
        const blocked = !org.blocked
        return { ...org, blocked, status: nextStatus(blocked) }
      })
    )
  }

  const removePending = (id: string) => {
    setPending((current) => current.filter((org) => org.id !== id))
    setSelectedKyc(null)
  }

  const newLabel = tab === 'individuals' ? 'New user' : 'New org'

  return (
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

          <button type="button" className={styles.newButton}>
            <Plus className={styles.plusIcon} />
            {newLabel}
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <div key={tab} className={`${styles.pane} ${direction < 0 ? styles.paneBack : ''}`}>
        {tab === 'individuals' && (
          <IndividualsTable
            rows={visibleRows as IndividualUser[]}
            menuId={menuId}
            onToggle={(id) => toggleBlocked(id, 'individual')}
            onMenu={setMenuId}
          />
        )}
        {tab === 'organizations' && (
          <OrganizationsTable
            rows={visibleRows as OrganizationUser[]}
            rowOffset={start}
            menuId={menuId}
            onToggle={(id) => toggleBlocked(id, 'organization')}
            onMenu={setMenuId}
          />
        )}
        {tab === 'pending' && (
          <PendingTable
            rows={visibleRows as PendingOrganization[]}
            rowOffset={start}
            onView={(org) => setSelectedKyc(toKycItem(org))}
            onAccept={(org) => removePending(org.id)}
            onReject={(org) => removePending(org.id)}
          />
        )}
        </div>
      </div>

      {activeRows.length > pageSize && (
        <div className={styles.footer}>
          <span className={styles.showing}>
            Showing {visibleRows.length} of {activeRows.length} items
          </span>
          <div className={styles.pager}>
            <button
              type="button"
              className={styles.pageArrow}
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft className={styles.pageIcon} />
            </button>
            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1
              const isCurrent = pageNumber === currentPage
              return (
                <button
                  key={pageNumber}
                  type="button"
                  className={`${styles.pageNumber} ${isCurrent ? styles.pageNumberActive : ''}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              )
            })}
            <button
              type="button"
              className={styles.pageArrow}
              aria-label="Next page"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight className={styles.pageIcon} />
            </button>
          </div>
        </div>
      )}

      <KYCDetailDrawer
        isOpen={Boolean(selectedKyc)}
        item={selectedKyc}
        onClose={() => setSelectedKyc(null)}
        onAccept={(item) => removePending(String(item.id))}
        onReject={(item) => removePending(String(item.id))}
      />
    </section>
  )
}

const StatusBadge: React.FC<{ status: AccountStatus }> = ({ status }) => (
  <span className={styles.status}>
    <span className={`${styles.statusDot} ${status === 'active' ? styles.dotActive : styles.dotBlocked}`} />
    {status === 'active' ? 'Active' : 'Blocked'}
  </span>
)

const CategoryBadge: React.FC<{ category: OrgCategory }> = ({ category }) => (
  <span className={`${styles.category} ${category === 'for-profit' ? styles.forProfit : styles.nonProfit}`}>
    {categoryLabel[category]}
  </span>
)

const BlockToggle: React.FC<{ blocked: boolean; label: string; onToggle: () => void }> = ({
  blocked,
  label,
  onToggle
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={blocked}
    aria-label={label}
    className={`${styles.toggle} ${blocked ? styles.toggleOn : styles.toggleOff}`}
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

const EmptyRow: React.FC<{ colSpan: number }> = ({ colSpan }) => (
  <tr>
    <td className={styles.empty} colSpan={colSpan}>
      No users match this view.
    </td>
  </tr>
)

const IndividualsTable: React.FC<{
  rows: IndividualUser[]
  menuId: string | null
  onToggle: (id: string) => void
  onMenu: (id: string | null) => void
}> = ({ rows, menuId, onToggle, onMenu }) => (
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
      {rows.length === 0 && <EmptyRow colSpan={8} />}
      {rows.map((user) => (
        <tr key={user.id}>
          <td>{user.userNo}</td>
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
              label={`${user.blocked ? 'Unblock' : 'Block'} ${user.name}`}
              onToggle={() => onToggle(user.id)}
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

const OrganizationsTable: React.FC<{
  rows: OrganizationUser[]
  rowOffset: number
  menuId: string | null
  onToggle: (id: string) => void
  onMenu: (id: string | null) => void
}> = ({ rows, rowOffset, menuId, onToggle, onMenu }) => (
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
      {rows.length === 0 && <EmptyRow colSpan={8} />}
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
            <CategoryBadge category={org.category} />
          </td>
          <td>{org.email}</td>
          <td>{org.joined}</td>
          <td>
            <StatusBadge status={org.status} />
          </td>
          <td className={styles.centerCell}>
            <BlockToggle
              blocked={org.blocked}
              label={`${org.blocked ? 'Unblock' : 'Block'} ${org.name}`}
              onToggle={() => onToggle(org.id)}
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
  rows: PendingOrganization[]
  rowOffset: number
  onView: (org: PendingOrganization) => void
  onAccept: (org: PendingOrganization) => void
  onReject: (org: PendingOrganization) => void
}> = ({ rows, rowOffset, onView, onAccept, onReject }) => (
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
      {rows.length === 0 && <EmptyRow colSpan={7} />}
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
            <CategoryBadge category={org.category} />
          </td>
          <td>{org.email}</td>
          <td>{org.submitted}</td>
          <td>
            <button type="button" className={styles.viewButton} onClick={() => onView(org)}>
              View
              <ExternalLink className={styles.viewIcon} />
            </button>
          </td>
          <td>
            <span className={styles.decisionActions}>
              <button type="button" className={styles.rejectButton} onClick={() => onReject(org)}>
                Reject
              </button>
              <button type="button" className={styles.acceptButton} onClick={() => onAccept(org)}>
                Accept
              </button>
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)

export default UsersBoard
