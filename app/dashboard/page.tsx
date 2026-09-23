import React from 'react'
import MetricCards from '../components/dashboard/MetricCards'
import AttentionNeeded from '../components/dashboard/AttentionNeeded'
import styles from './Dashboard.module.css'

const DashboardPage = () => {
  return (
    <div className={styles.dashboardContainer}>
      {/* 4 Metric Cards */}
      <MetricCards />

      {/* Attention Needed Section */}
      <div className="mt-2">
        <AttentionNeeded />
      </div>
    </div>
  )
}

export default DashboardPage