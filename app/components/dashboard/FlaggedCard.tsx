'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import AvatarIllustration from './AvatarIllustration'
import styles from './FlaggedCard.module.css'

export interface FlaggedItem {
  id: string | number
  name?: string
  username?: string
  category?: string
  timeAgo: string
  comment?: string
  hasMoreComment?: boolean
  targetTitle: string
  targetImage?: string
  avatarUrl?: string
  reason?: string
  reportCount?: number
}

interface FlaggedCardProps {
  item: FlaggedItem
  onReview?: (item: FlaggedItem) => void
  onDismiss?: (item: FlaggedItem) => void
}

export const FlaggedCard: React.FC<FlaggedCardProps> = ({
  item,
  onReview,
  onDismiss
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const username =
    item.username ||
    (item.name ? `@${item.name.toLowerCase().replace(/\s+/g, '_')}` : '@ademide_jerry')
  const comment =
    item.comment || 'This is actually really despicable. Racist content shoul...'
  const targetImage =
    item.targetImage ||
    'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=300&auto=format&fit=crop&q=80'

  return (
    <div className={styles.card}>
      {/* Top Section: User & Flagged Comment */}
      <div className={styles.topSection}>
        <div className={styles.avatarContainer}>
          {item.avatarUrl ? (
            <img
              src={item.avatarUrl}
              alt={username}
              className={styles.avatarImage}
            />
          ) : (
            <AvatarIllustration className={styles.avatarIllustration} />
          )}
        </div>

        <div className={styles.userContent}>
          <div className={styles.userMeta}>
            <span className={styles.username}>{username}</span>
            <span className={styles.timeAgo}>{item.timeAgo}</span>
          </div>

          <p className={styles.commentText}>
            {comment}{' '}
            {item.hasMoreComment !== false && (
              <button
                type="button"
                className={styles.moreButton}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'less' : 'more'}
              </button>
            )}
          </p>
        </div>
      </div>

      {/* Middle Quoted Content Card */}
      <div className={styles.quotedContainer}>
        <div className={styles.quotedImageContainer}>
          <img
            src={targetImage}
            alt={item.targetTitle}
            className={styles.quotedImage}
          />
        </div>
        <p className={styles.quotedTitle}>{item.targetTitle}</p>
      </div>

      {/* Bottom Action Row */}
      <div className={styles.actionRow}>
        <button
          type="button"
          onClick={() => onDismiss?.(item)}
          className={styles.dismissButton}
          aria-label="Dismiss flagged content"
        >
          <X className={styles.dismissIcon} />
        </button>

        <button
          type="button"
          onClick={() => onReview?.(item)}
          className={styles.reviewButton}
        >
          Review
        </button>
      </div>
    </div>
  )
}

export default FlaggedCard

