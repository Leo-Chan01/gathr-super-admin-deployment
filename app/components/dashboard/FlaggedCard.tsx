'use client'

import React from 'react'
import { AlertCircle, ChevronRight, Flag } from 'lucide-react'
import AvatarIllustration from './AvatarIllustration'
import styles from './FlaggedCard.module.css'

export interface FlaggedItem {
  id: string | number
  name: string
  category: string
  timeAgo: string
  reason: string
  reportCount: number
  targetTitle: string
}

interface FlaggedCardProps {
  item: FlaggedItem
  onReview?: () => void
}

export const FlaggedCard: React.FC<FlaggedCardProps> = ({ item, onReview }) => {
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

      {/* Flag Reason Details */}
      <div className={styles.detailsList}>
        <div className={styles.reasonRow}>
          <Flag className={styles.flagIcon} />
          <span>{item.reason}</span>
        </div>
        <p className={styles.campaignSnippet}>
          Campaign: <span className={styles.campaignName}>{item.targetTitle}</span>
        </p>
        <div className={styles.reportsCount}>
          <AlertCircle className={styles.alertIcon} />
          <span>{item.reportCount} user reports filed</span>
        </div>
      </div>

      {/* Bottom Action */}
      <div className={styles.actionRow}>
        <span className={styles.statusNote}>Requires review</span>
        <button
          type="button"
          onClick={onReview}
          className={styles.reviewButton}
        >
          View
        </button>
      </div>
    </div>
  )
}

export default FlaggedCard
