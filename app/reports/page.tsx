import React from 'react'
import MetricCards from '../components/dashboard/MetricCards'
import ReportsQueue from '../components/reports/ReportsQueue'
import { reportMetrics } from '../components/reports/reportData'
import styles from './Reports.module.css'

const ReportsPage = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Reports</h1>
        <p className={styles.subtitle}>
          Review flagged posts, assess community violations, and take moderation actions
        </p>
      </header>

      <MetricCards metrics={reportMetrics} />
      <ReportsQueue />
    </div>
  )
}

export default ReportsPage
