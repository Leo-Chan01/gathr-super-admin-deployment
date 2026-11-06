'use client'

import React from 'react'
import { X } from 'lucide-react'
import AvatarIllustration from '../dashboard/AvatarIllustration'
import { ErrorState } from '../common/AsyncState'
import { getWithdrawal } from '../../lib/api/admin'
import { toWithdrawalDetail } from '../../lib/api/adapters'
import { useResource } from '../../lib/hooks/useResource'
import drawer from '../dashboard/KYCDetailDrawer.module.css'
import styles from '../common/DetailRows.module.css'

interface WithdrawalDetailDrawerProps {
  withdrawalId: string | null
  onClose: () => void
}

export const WithdrawalDetailDrawer: React.FC<WithdrawalDetailDrawerProps> = ({ withdrawalId, onClose }) => {
  if (!withdrawalId) return null
  return <Panel key={withdrawalId} withdrawalId={withdrawalId} onClose={onClose} />
}

const Panel: React.FC<{ withdrawalId: string; onClose: () => void }> = ({ withdrawalId, onClose }) => {
  const withdrawal = useResource(
    (signal) => getWithdrawal(withdrawalId, { signal }).then(toWithdrawalDetail),
    [withdrawalId]
  )
  const detail = withdrawal.data

  return (
    <div className={drawer.overlay} onClick={onClose}>
      <div
        className={drawer.drawer}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Withdrawal request"
      >
        <div className={drawer.header}>
          <div className={drawer.headerLeft}>
            <AvatarIllustration />
            <div className={drawer.headerInfo}>
              <h2 className={drawer.title}>{detail?.item.name ?? 'Withdrawal request'}</h2>
              {detail && (
                <div className={drawer.metaRow}>
                  <span className={drawer.badge}>{detail.item.category}</span>
                  <span className={drawer.bullet}>•</span>
                  <span className={drawer.timeAgo}>{detail.item.timeAgo}</span>
                </div>
              )}
            </div>
          </div>
          <button type="button" className={drawer.closeButton} onClick={onClose} aria-label="Close drawer">
            <X className={drawer.closeIcon} />
          </button>
        </div>

        {withdrawal.loading && !detail && (
          <div className={styles.loading} aria-busy="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        )}
        {withdrawal.error && <ErrorState message={withdrawal.error} onRetry={withdrawal.reload} />}

        {detail && (
          <dl className={styles.rows}>
            {detail.rows.map((row) => (
              <React.Fragment key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </React.Fragment>
            ))}
          </dl>
        )}

        <div className={styles.spacer} />
        <div className={drawer.footerActions}>
          <button type="button" className={drawer.cancelRejectButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default WithdrawalDetailDrawer
