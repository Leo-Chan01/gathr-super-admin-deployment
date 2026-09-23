'use client'

import React from 'react'
import { Landmark, ShieldCheck, ChevronRight, Banknote } from 'lucide-react'
import AvatarIllustration from './AvatarIllustration'
import styles from './WithdrawalCard.module.css'

export interface WithdrawalItem {
  id: string | number
  name: string
  category: string
  timeAgo: string
  amount: string
  bankName: string
  accountLast4: string
  walletType: string
  campaignName: string
  thumbnailUrl: string
}

interface WithdrawalCardProps {
  item: WithdrawalItem
  onView?: () => void
}

export const WithdrawalCard: React.FC<WithdrawalCardProps> = ({ item, onView }) => {
  return (
    <div className={styles.card}>
      {/* Top Header Row */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <AvatarIllustration />
          <div className={styles.headerInfo}>
            <h3 className={styles.title}>{item.name}</h3>
            <div className={styles.metaRow}>
              <span className={styles.badge}>{item.category}</span>
              <span className={styles.bullet}>•</span>
              <span className={styles.timeAgo}>{item.timeAgo}</span>
            </div>
          </div>
        </div>

        <ChevronRight className={styles.chevronIcon} />
      </div>

      {/* Middle Financial Details */}
      <div className={styles.detailsList}>
        {/* Amount */}
        <div className={styles.detailRow}>
          <Banknote className={styles.amountIcon} />
          <span className={styles.amountValue}>{item.amount}</span>
        </div>

        {/* Bank */}
        <div className={styles.detailRow}>
          <Landmark className={styles.bankIcon} />
          <span className={styles.bankText}>
            {item.bankName} • ••••• {item.accountLast4}
          </span>
        </div>

        {/* Campaign / Wallet */}
        <div className={styles.detailRow}>
          <ShieldCheck className={styles.walletIcon} />
          <span className={styles.walletText}>
            {item.walletType} · {item.campaignName}
          </span>
        </div>
      </div>

      {/* Bottom Action Row */}
      <div className={styles.actionRow}>
        <div className={styles.thumbnailContainer}>
          <img
            src={item.thumbnailUrl}
            alt={item.campaignName}
            className={styles.thumbnailImage}
          />
        </div>

        <button type="button" onClick={onView} className={styles.viewButton}>
          View
        </button>
      </div>
    </div>
  )
}

export default WithdrawalCard

