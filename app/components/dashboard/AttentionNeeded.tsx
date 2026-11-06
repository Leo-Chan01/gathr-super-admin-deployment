'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import KYCCard, { KYCItem } from './KYCCard'
import WithdrawalCard from './WithdrawalCard'
import FlaggedCard, { FlaggedItem } from './FlaggedCard'
import KYCDetailDrawer from './KYCDetailDrawer'
import ReportReviewDrawer from '../reports/ReportReviewDrawer'
import WithdrawalDetailDrawer from '../wallets/WithdrawalDetailDrawer'
import { ErrorState, SkeletonGrid } from '../common/AsyncState'
import { useReflow, useTabIndicator } from '../motion/useMotion'
import {
  approveKyc,
  listFlaggedContent,
  listPendingKyc,
  listWithdrawals,
  rejectKyc,
  reviewReport
} from '../../lib/api/admin'
import { toKycItem, toReportItem, toWithdrawalItem } from '../../lib/api/adapters'
import { errorMessage } from '../../lib/api/client'
import type { Page } from '../../lib/api/types'
import { useResource } from '../../lib/hooks/useResource'
import styles from './AttentionNeeded.module.css'

type TabType = 'flagged' | 'kyc' | 'withdrawal'

const tabOrder: TabType[] = ['flagged', 'kyc', 'withdrawal']

const tabMeta: Record<TabType, { label: string; href: string; limit: number }> = {
  flagged: { label: 'Flagged content', href: '/reports', limit: 6 },
  kyc: { label: 'Pending KYC', href: '/users?tab=pending', limit: 8 },
  withdrawal: { label: 'Withdrawal request', href: '/wallets', limit: 6 }
}

const mapPage = <T,>(page: Page<Record<string, unknown>>, map: (raw: Record<string, unknown>) => T) => ({
  items: page.items.map(map),
  total: page.meta.totalItems
})

const without =
  (id: string) =>
  <T extends { id: string | number }>(current: { items: T[]; total: number } | undefined) =>
    current
      ? { items: current.items.filter((item) => String(item.id) !== id), total: Math.max(0, current.total - 1) }
      : current

interface AttentionNeededProps {
  /** Queue sizes from GET /admin/dashboard; falls back to each list's total. */
  counts?: { flagged?: number; kyc?: number; withdrawals?: number }
  /** Called after an item leaves a queue so the parent can refresh counts. */
  onQueueChange?: () => void
}

export const AttentionNeeded: React.FC<AttentionNeededProps> = ({ counts = {}, onQueueChange }) => {
  const [activeTab, setActiveTab] = useState<TabType>('kyc')
  const [direction, setDirection] = useState<1 | -1>(1)
  const [selectedKYCItem, setSelectedKYCItem] = useState<KYCItem | null>(null)
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { tabsRef, indicator } = useTabIndicator(activeTab)
  const flaggedGridRef = useRef<HTMLDivElement>(null)
  const beginFlaggedRemove = useReflow(flaggedGridRef)

  const flagged = useResource(
    (signal) =>
      listFlaggedContent({ page: 1, limit: tabMeta.flagged.limit }, { signal }).then((p) => mapPage(p, toReportItem)),
    []
  )
  const kyc = useResource(
    (signal) => listPendingKyc({ page: 1, limit: tabMeta.kyc.limit }, { signal }).then((p) => mapPage(p, toKycItem)),
    []
  )
  const withdrawals = useResource(
    (signal) =>
      listWithdrawals({ page: 1, limit: tabMeta.withdrawal.limit, status: 'PENDING' }, { signal }).then((p) =>
        mapPage(p, toWithdrawalItem)
      ),
    []
  )

  const resources = { flagged, kyc, withdrawal: withdrawals }
  const countFor = (tab: TabType) => {
    const fromDashboard = tab === 'flagged' ? counts.flagged : tab === 'kyc' ? counts.kyc : counts.withdrawals
    return fromDashboard ?? resources[tab].data?.total
  }

  const active = resources[activeTab]
  const showing = active.data?.items.length ?? 0
  const total = countFor(activeTab) ?? showing

  /** Drop an item locally, then refresh counts. */
  const removeFrom = (tab: 'flagged' | 'kyc', id: string) => {
    if (tab === 'flagged') flagged.mutate(without(id))
    else kyc.mutate(without(id))
    onQueueChange?.()
  }

  const handleAcceptKYC = async (item: KYCItem) => {
    await approveKyc(String(item.id))
    removeFrom('kyc', String(item.id))
  }

  const handleRejectKYC = async (item: KYCItem, reason: string) => {
    await rejectKyc(String(item.id), reason)
    removeFrom('kyc', String(item.id))
  }

  const selectTab = (next: TabType) => {
    if (next === activeTab) return
    setDirection(tabOrder.indexOf(next) > tabOrder.indexOf(activeTab) ? 1 : -1)
    setActiveTab(next)
    setActionError(null)
  }

  const dismissFlagged = async (item: FlaggedItem) => {
    const id = String(item.id)
    setBusyId(id)
    setActionError(null)
    try {
      await reviewReport(id, 'DISMISSED', 'Dismissed from dashboard')
      beginFlaggedRemove(id)
      removeFrom('flagged', id)
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const renderBody = () => {
    if (active.error) return <ErrorState message={active.error} onRetry={active.reload} />

    if (active.loading && !active.data) {
      const gridClass =
        activeTab === 'kyc' ? styles.kycGrid : activeTab === 'flagged' ? styles.flaggedGrid : styles.withdrawalGrid
      return (
        <SkeletonGrid
          count={tabMeta[activeTab].limit}
          className={gridClass}
          height={activeTab === 'kyc' ? 110 : 200}
        />
      )
    }

    if (activeTab === 'flagged') {
      const items = flagged.data?.items ?? []
      return items.length > 0 ? (
        <div className={styles.flaggedGrid} ref={flaggedGridRef}>
          {items.map((item) => (
            <div key={item.id} data-flip-id={String(item.id)} className={styles.flipItem}>
              <FlaggedCard
                item={item}
                busy={busyId === String(item.id)}
                onDismiss={dismissFlagged}
                onReview={(entry) => setReviewId(String(entry.id))}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No flagged content needs attention.</p>
      )
    }

    if (activeTab === 'kyc') {
      const items = kyc.data?.items ?? []
      return items.length > 0 ? (
        <div className={styles.kycGrid}>
          {items.map((item) => (
            <KYCCard key={item.id} item={item} onClick={() => setSelectedKYCItem(item)} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No verifications waiting for review.</p>
      )
    }

    const items = withdrawals.data?.items ?? []
    return items.length > 0 ? (
      <div className={styles.withdrawalGrid}>
        {items.map((item) => (
          <WithdrawalCard key={item.id} item={item} onView={() => setWithdrawalId(String(item.id))} />
        ))}
      </div>
    ) : (
      <p className={styles.empty}>No pending withdrawal requests.</p>
    )
  }

  return (
    <div className={styles.container}>
      {/* Section Header with Title and Tabs */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>Attention Needed</h2>
          <p className={styles.subtitle}>
            High-priority items requiring immediate intervention
          </p>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabsContainer} role="tablist" aria-label="Attention needed" ref={tabsRef}>
          {indicator.ready && (
            <span
              className={styles.tabIndicator}
              style={{
                width: indicator.width,
                transform: `translateX(${indicator.x}px)`
              }}
            />
          )}
          {tabOrder.map((key) => {
            const isActive = activeTab === key
            const count = countFor(key)
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => selectTab(key)}
                className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
              >
                <span>
                  {tabMeta[key].label}
                  {count !== undefined && ` (${count.toLocaleString('en-US')})`}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {actionError && <ErrorState message={actionError} compact />}

      {/* Grid Content */}
      <div className={styles.contentGridArea}>
        <div
          key={activeTab}
          className={`${styles.pane} ${direction < 0 ? styles.paneBack : ''}`}
        >
          {renderBody()}
        </div>
      </div>

      {/* Footer Navigation Bar */}
      <div className={styles.footerBar}>
        <span className={styles.showingText}>
          Showing {showing} of {total.toLocaleString('en-US')} items
        </span>

        <Link href={tabMeta[activeTab].href} className={styles.viewAllButton}>
          View all
        </Link>
      </div>

      {/* KYC Right Aside Drawer */}
      <KYCDetailDrawer
        isOpen={Boolean(selectedKYCItem)}
        item={selectedKYCItem}
        onClose={() => setSelectedKYCItem(null)}
        onAccept={handleAcceptKYC}
        onReject={handleRejectKYC}
      />

      <ReportReviewDrawer
        reportId={reviewId}
        onClose={() => setReviewId(null)}
        onReviewed={(id) => {
          beginFlaggedRemove(id)
          removeFrom('flagged', id)
        }}
      />

      <WithdrawalDetailDrawer withdrawalId={withdrawalId} onClose={() => setWithdrawalId(null)} />
    </div>
  )
}

export default AttentionNeeded
