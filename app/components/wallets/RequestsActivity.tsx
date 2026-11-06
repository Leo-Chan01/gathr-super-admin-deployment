'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import AvatarIllustration from '../dashboard/AvatarIllustration'
import avatarStyles from '../dashboard/AvatarIllustration.module.css'
import WithdrawalCard from '../dashboard/WithdrawalCard'
import WithdrawalDetailDrawer from './WithdrawalDetailDrawer'
import { ErrorState, SkeletonGrid } from '../common/AsyncState'
import { listWithdrawals } from '../../lib/api/admin'
import { toWithdrawalItem } from '../../lib/api/adapters'
import type { WithdrawalStatus } from '../../lib/api/types'
import { useResource } from '../../lib/hooks/useResource'
// Transaction history has no admin endpoint yet, so it still renders sample data.
import { walletRequests, type WalletRequest } from './walletData'
import styles from './RequestsActivity.module.css'

type ActivityTab = 'history' | 'withdrawals'

const RANGES = [
  { id: '7', label: 'Last 7 days', days: 7 },
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: '90', label: 'Last 90 days', days: 90 }
] as const

type RangeId = (typeof RANGES)[number]['id']

const PAGE_SIZE = 6

/** The admin queue only needs open requests; the endpoint also accepts other statuses. */
const WITHDRAWAL_STATUS: WithdrawalStatus = 'PENDING'

const formatAmount = (item: WalletRequest) => {
  const formatted = Math.abs(item.signedAmount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return `${item.signedAmount > 0 ? '+' : '-'}$${formatted}`
}

export const RequestsActivity: React.FC = () => {
  const [tab, setTab] = useState<ActivityTab>('history')
  const [rangeId, setRangeId] = useState<RangeId>('30')
  const [rangeOpen, setRangeOpen] = useState(false)
  const [page, setPage] = useState(1)
  const rangeRef = useRef<HTMLDivElement>(null)
  const [withdrawalPage, setWithdrawalPage] = useState(1)
  const [viewId, setViewId] = useState<string | null>(null)

  const withdrawals = useResource(
    async (signal) => {
      if (tab !== 'withdrawals') return null
      const result = await listWithdrawals(
        { page: withdrawalPage, limit: PAGE_SIZE, status: WITHDRAWAL_STATUS },
        { signal }
      )
      return { items: result.items.map(toWithdrawalItem), meta: result.meta }
    },
    [tab, withdrawalPage]
  )

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rangeRef.current?.contains(event.target as Node)) setRangeOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const range = RANGES.find((item) => item.id === rangeId) ?? RANGES[1]

  const filtered = useMemo(
    () => walletRequests.filter((item) => item.ageDays <= range.days),
    [range.days]
  )

  const historyPageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  if (page > historyPageCount) setPage(historyPageCount)

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const withdrawalItems = withdrawals.data?.items ?? []
  const withdrawalMeta = withdrawals.data?.meta
  const isWithdrawals = tab === 'withdrawals'
  const pageCount = isWithdrawals ? withdrawalMeta?.totalPages ?? 1 : historyPageCount
  const currentPage = isWithdrawals ? withdrawalPage : page
  const goTo = (next: number) => (isWithdrawals ? setWithdrawalPage(next) : setPage(next))
  const groups = pageItems.reduce<Array<{ group: string; items: WalletRequest[] }>>((entries, item) => {
    const current = entries[entries.length - 1]
    if (current?.group === item.group) {
      current.items.push(item)
    } else {
      entries.push({ group: item.group, items: [item] })
    }
    return entries
  }, [])

  const selectTab = (next: ActivityTab) => {
    setTab(next)
    setPage(1)
  }

  return (
    <section className={styles.container}>
      <div className={styles.head}>
        <div>
          <h2 className={styles.title}>Requests & Activity</h2>
          <p className={styles.subtitle}>Review incoming withdrawal requests and recent payout activity</p>
        </div>
        <div className={styles.tabs} role="tablist" aria-label="Activity type">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'history'}
            className={`${styles.tab} ${tab === 'history' ? styles.tabActive : ''}`}
            onClick={() => selectTab('history')}
          >
            Transaction history
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'withdrawals'}
            className={`${styles.tab} ${tab === 'withdrawals' ? styles.tabActive : ''}`}
            onClick={() => selectTab('withdrawals')}
          >
            Withdrawal request
          </button>
        </div>
      </div>

      {tab === 'history' && (
      <div className={styles.rangeRow}>
        <div className={styles.rangeWrap} ref={rangeRef}>
          <button
            type="button"
            className={styles.rangeButton}
            aria-expanded={rangeOpen}
            onClick={() => setRangeOpen((open) => !open)}
          >
            <Calendar className={styles.rangeIcon} />
            Time range: {range.label}
            <ChevronDown className={styles.rangeIcon} />
          </button>
          {rangeOpen && (
            <ul className={styles.rangeMenu}>
              {RANGES.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`${styles.rangeOption} ${item.id === rangeId ? styles.rangeOptionActive : ''}`}
                    onClick={() => {
                      setRangeId(item.id)
                      setPage(1)
                      setRangeOpen(false)
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      )}

      {isWithdrawals ? (
        withdrawals.error ? (
          <ErrorState message={withdrawals.error} onRetry={withdrawals.reload} />
        ) : withdrawals.loading && !withdrawals.data ? (
          <SkeletonGrid count={PAGE_SIZE} className={styles.requestGrid} height={200} />
        ) : withdrawalItems.length === 0 ? (
          <p className={styles.empty}>No pending withdrawal requests.</p>
        ) : (
          <div className={styles.requestGrid}>
            {withdrawalItems.map((item) => (
              <WithdrawalCard key={item.id} item={item} onView={() => setViewId(String(item.id))} />
            ))}
          </div>
        )
      ) : groups.length === 0 ? (
        <p className={styles.empty}>No activity in this range.</p>
      ) : (
        <div className={styles.groups}>
          {groups.map(({ group, items }) => (
            <div key={group}>
              <p className={styles.groupLabel}>{group}</p>
              <div className={styles.dayCard}>
                {items.map((item) => {
                  const isCredit = item.signedAmount > 0
                  return (
                    <div key={item.id} className={styles.row}>
                      <span className={styles.rowLeft}>
                        <AvatarIllustration className={avatarStyles.round} />
                        <span className={styles.rowName}>{item.name}</span>
                      </span>
                      <span className={`${styles.amount} ${isCredit ? styles.credit : styles.debit}`}>
                        {formatAmount(item)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={tab === 'withdrawals' ? styles.footer : styles.historyPager}>
        {tab === 'withdrawals' && (
          <span className={styles.showingText}>
            Showing {withdrawalItems.length} of {(withdrawalMeta?.totalItems ?? 0).toLocaleString('en-US')} items
          </span>
        )}
      <nav className={styles.pager} aria-label="Activity pages">
        <button
          type="button"
          className={styles.pageStep}
          aria-label="Previous page"
          disabled={currentPage <= 1}
          onClick={() => goTo(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft className={styles.rangeIcon} />
        </button>
        {Array.from({ length: Math.min(pageCount, 7) }, (_, index) => {
          // Slide a 7-page window around the current page.
          const start = Math.min(Math.max(1, currentPage - 3), Math.max(1, pageCount - 6))
          const number = start + index
          return (
            <button
              key={number}
              type="button"
              className={`${styles.pageNumber} ${number === currentPage ? styles.pageActive : ''}`}
              aria-current={number === currentPage ? 'page' : undefined}
              onClick={() => goTo(number)}
            >
              {number}
            </button>
          )
        })}
        <button
          type="button"
          className={styles.pageStep}
          aria-label="Next page"
          disabled={currentPage >= pageCount}
          onClick={() => goTo(Math.min(pageCount, currentPage + 1))}
        >
          <ChevronRight className={styles.rangeIcon} />
        </button>
      </nav>
      </div>

      <WithdrawalDetailDrawer withdrawalId={viewId} onClose={() => setViewId(null)} />
    </section>
  )
}

export default RequestsActivity
