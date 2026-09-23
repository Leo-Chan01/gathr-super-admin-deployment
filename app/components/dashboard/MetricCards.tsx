'use client'

import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import styles from './MetricCards.module.css'

interface MetricItem {
  title: string
  value: string
  change: string
  isPositive: boolean
}

const metrics: MetricItem[] = [
  {
    title: 'Total Users',
    value: '25k',
    change: '+6.08%',
    isPositive: true
  },
  {
    title: 'Total Amount Raised',
    value: '$3.2m',
    change: '+6.08%',
    isPositive: true
  },
  {
    title: 'Active Campaigns',
    value: '102.1k',
    change: '+6.08%',
    isPositive: false
  },
  {
    title: 'Reports',
    value: '240',
    change: '+6.08%',
    isPositive: true
  }
]

export const MetricCards: React.FC = () => {
  return (
    <div className={styles.grid}>
      {metrics.map((metric, index) => {
        const isUp = metric.isPositive
        return (
          <div key={index} className={styles.card}>
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
