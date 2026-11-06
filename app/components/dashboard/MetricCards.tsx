'use client'

import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import styles from './MetricCards.module.css'

export interface MetricItem {
  title: string
  value: string
  /** Omitted when the API doesn't return a period-over-period change. */
  change?: string
  isPositive: boolean
  tone?: 'blue' | 'green' | 'gray' | 'pink'
}

interface MetricCardsProps {
  metrics?: MetricItem[]
  /** Shows placeholder values while the first load is in flight. */
  loading?: boolean
}

const toneClassName: Record<NonNullable<MetricItem['tone']>, string> = {
  blue: styles.toneBlue,
  green: styles.toneGreen,
  gray: styles.toneGray,
  pink: styles.tonePink
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics = [], loading = false }) => {
  return (
    <div className={styles.grid} aria-busy={loading}>
      {metrics.map((metric) => {
        const isUp = metric.isPositive
        const toneClass = metric.tone ? toneClassName[metric.tone] : ''
        return (
          <div key={metric.title} className={`${styles.card} ${toneClass}`}>
            <span className={styles.title}>{metric.title}</span>

            <div className={styles.valueRow}>
              {loading ? (
                <span className={styles.valueSkeleton} aria-hidden="true" />
              ) : (
                <span className={styles.value}>{metric.value}</span>
              )}

              {!loading && metric.change && (
                <div className={`${styles.trend} ${isUp ? styles.trendUp : styles.trendDown}`}>
                  <span>{metric.change}</span>
                  {isUp ? (
                    <TrendingUp className={styles.trendIcon} />
                  ) : (
                    <TrendingDown className={styles.trendIcon} />
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MetricCards
