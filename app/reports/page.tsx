import React from 'react'
import ReportsQueue from '../components/reports/ReportsQueue'
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

      <ReportsQueue />
    </div>
  )
}

export default ReportsPage
