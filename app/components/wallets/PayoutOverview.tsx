'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronDown, Download, Plus } from 'lucide-react'
import { Liveline, type LivelinePoint } from 'liveline'
import DisbursalDialog from './DisbursalDialog'
import styles from './PayoutOverview.module.css'

const RANGES = [
  { id: '7', label: 'Last 7 days', days: 7 },
  { id: '30', label: 'Last 30 days', days: 29 },
  { id: '90', label: 'Last 90 days', days: 90 }
] as const

type RangeId = (typeof RANGES)[number]['id']
type Metric = 'amount' | 'transactions' | null

const DAY_SECS = 60 * 60 * 24
const chartEndSecs = Math.floor(Date.now() / 1000)

const recentAmount = [
  2.62, 2.65, 2.58, 2.52, 2.6, 2.72, 2.55, 2.48, 2.62, 2.84, 3.05, 3.28, 3.5, 3.68, 3.82, 3.9,
  3.74, 3.55, 3.42, 3.34, 3.4, 3.58, 3.9, 4.35, 4.9, 5.4, 5.85, 6.2, 6.45, 6.6
]

const recentTransactions = [
  2.05, 1.98, 1.88, 1.76, 1.66, 1.62, 1.7, 1.8, 1.9, 1.96, 2.02, 2.06, 2.1, 2.08, 2.04, 2.08,
  2.12, 2.16, 2.18, 2.2, 2.22, 2.26, 2.3, 2.34, 2.38, 2.42, 2.46, 2.48, 2.5, 2.52
]

const earlier = (count: number, start: number, end: number, amplitude: number) =>
  Array.from({ length: count }, (_, index) => {
    const progress = index / Math.max(count - 1, 1)
    return start + (end - start) * progress + Math.sin(index / 2.4) * amplitude
  })

const amountSeries = [...earlier(60, 2.2, recentAmount[0], 0.22), ...recentAmount]
const transactionSeries = [...earlier(60, 1.7, recentTransactions[0], 0.12), ...recentTransactions]

const toPoints = (values: number[]): LivelinePoint[] => {
  const start = chartEndSecs - (values.length - 1) * DAY_SECS
  return values.map((value, index) => ({
    time: start + index * DAY_SECS,
    value
  }))
}

const formatMillions = (value: number) => {
  if (value < 0.05) return 'N0'
  return `N${value.toFixed(1)}M`
}

export const PayoutOverview: React.FC = () => {
  const [rangeId, setRangeId] = useState<RangeId>('30')
  const [rangeOpen, setRangeOpen] = useState(false)
  const [metric, setMetric] = useState<Metric>('amount')
  const [disbursalOpen, setDisbursalOpen] = useState(false)
  const rangeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rangeRef.current?.contains(event.target as Node)) setRangeOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const range = RANGES.find((item) => item.id === rangeId) ?? RANGES[1]
  const amount = amountSeries.slice(-range.days)
  const transactions = transactionSeries.slice(-range.days)
  const chart = useMemo(() => {
    const amountPoints = toPoints(amount)
    const transactionPoints = toPoints(transactions)
    return {
      amountPoints,
      transactionPoints,
      amountValue: amountPoints[amountPoints.length - 1]?.value ?? 0,
      transactionValue: transactionPoints[transactionPoints.length - 1]?.value ?? 0
    }
  }, [amount, transactions])

  const formatTime = (time: number) => {
    const label = new Date(time * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    })
    if (Math.abs(time - chartEndSecs) < DAY_SECS / 2) return `${label} (Today)`
    return label
  }

  const handleDownload = () => {
    const rows = [
      ['Date', 'Amount sent (N)', 'Transactions (N)'],
      ...amount.map((value, index) => [
        new Date((chartEndSecs - (amount.length - 1 - index) * DAY_SECS) * 1000).toISOString().slice(0, 10),
        String(Math.round(value * 1_000_000)),
        String(Math.round(transactions[index] * 1_000_000))
      ])
    ]
    const csv = rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'payout-statement.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.rangeWrap} ref={rangeRef}>
          <button
            type="button"
            className={styles.rangeButton}
            aria-expanded={rangeOpen}
            onClick={() => setRangeOpen((open) => !open)}
          >
            <Calendar className={styles.toolbarIcon} />
            Time range: {range.label}
            <ChevronDown className={styles.toolbarIcon} />
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

        <div className={styles.toolbarActions}>
          <button type="button" className={styles.statementButton} onClick={handleDownload}>
            <Download className={styles.toolbarIcon} />
            Download Statement
          </button>
          <button type="button" className={styles.disbursalButton} onClick={() => setDisbursalOpen(true)}>
            <Plus className={styles.toolbarIcon} />
            New Disbursal
          </button>
        </div>
      </div>

      <div className={styles.overviewHead}>
        <div>
          <h2 className={styles.title}>Payouts Overview</h2>
          <p className={styles.subtitle}>Volume and transaction trajectory over the selected period</p>
        </div>

        <div className={styles.overviewTools}>
          <div className={styles.legend}>
            <span className={`${styles.legendItem} ${metric === 'transactions' ? styles.legendMuted : ''}`}>
              <span className={`${styles.dot} ${styles.dotAmount}`} />
              Amount sent (N)
            </span>
            <span className={`${styles.legendItem} ${metric === 'amount' ? styles.legendMuted : ''}`}>
              <span className={`${styles.dot} ${styles.dotTransactions}`} />
              Transactions
            </span>
          </div>
          <div className={styles.toggle} role="group" aria-label="Chart metric">
            <button
              type="button"
              className={metric === 'amount' ? styles.toggleActive : ''}
              aria-pressed={metric === 'amount'}
              onClick={() => setMetric((current) => (current === 'amount' ? null : 'amount'))}
            >
              Amount
            </button>
            <button
              type="button"
              className={metric === 'transactions' ? styles.toggleActive : ''}
              aria-pressed={metric === 'transactions'}
              onClick={() => setMetric((current) => (current === 'transactions' ? null : 'transactions'))}
            >
              Transactions
            </button>
          </div>
        </div>
      </div>

      <div className={styles.chart}>
        <Liveline
          key={metric ?? 'both'}
          data={metric === 'transactions' ? chart.transactionPoints : chart.amountPoints}
          value={metric === 'transactions' ? chart.transactionValue : chart.amountValue}
          series={
            metric === null
              ? [
                  {
                    id: 'amount',
                    label: 'Amount sent',
                    color: '#ef4b45',
                    data: chart.amountPoints,
                    value: chart.amountValue
                  },
                  {
                    id: 'transactions',
                    label: 'Transactions',
                    color: '#5b8def',
                    data: chart.transactionPoints,
                    value: chart.transactionValue
                  }
                ]
              : undefined
          }
          theme="light"
          color={metric === 'transactions' ? '#5b8def' : '#ef4b45'}
          fill
          grid
          scrub
          badge={false}
          momentum={false}
          pulse={false}
          window={range.days * DAY_SECS}
          formatValue={formatMillions}
          formatTime={formatTime}
          padding={{ top: 16, right: 16, bottom: 28, left: 8 }}
          style={{ height: 280 }}
        />
      </div>
      <DisbursalDialog open={disbursalOpen} onClose={() => setDisbursalOpen(false)} />
    </section>
  )
}

export default PayoutOverview
