'use client'

import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import styles from './MetricCards.module.css'

export interface MetricItem {
  title: string
  value: string
  change: string
  isPositive: boolean
  tone?: 'blue' | 'green' | 'gray' | 'pink'
}

interface MetricCardsProps {
  metrics?: MetricItem[]
}

const defaultMetrics: MetricItem[] = [
  {
    title: 'Total Users',
    value: '25k',
    change: '+6.08%',
    isPositive: true,
    tone: 'blue'
  },
  {
    title: 'Total Amount Raised',
    value: '$3.2m',
    change: '+6.08%',
    isPositive: true,
    tone: 'green'
  },
  {
    title: 'Active Campaigns',
    value: '102.1k',
    change: '+6.08%',
    isPositive: false,
    tone: 'gray'
  },
  {
    title: 'Reports',
    value: '240',
    change: '+6.08%',
    isPositive: true,
    tone: 'pink'
  }
]

const toneClassName: Record<NonNullable<MetricItem['tone']>, string> = {
  blue: styles.toneBlue,
  green: styles.toneGreen,
  gray: styles.toneGray,
  pink: styles.tonePink
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics = defaultMetrics }) => {
  return (
    <div className={styles.grid}>
      {metrics.map((metric) => {
        const isUp = metric.isPositive
        const toneClass = metric.tone ? toneClassName[metric.tone] : ''
        return (
          <div key={metric.title} className={`${styles.card} ${toneClass}`}>
            <span className={styles.title}>{metric.title}</span>

            <div className={styles.valueRow}>
              <span className={styles.value}>{metric.value}</span>

              <div
                className={`${styles.trend} ${isUp ? styles.trendUp : styles.trendDown
                  }`}
              >
                <span>{metric.change}</span>
                {isUp ? (
                  <TrendingUp className={styles.trendIcon} />
                ) : (
                  <TrendingDown className={styles.trendIcon} />
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MetricCards
