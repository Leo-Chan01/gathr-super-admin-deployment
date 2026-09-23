import React from 'react'
import SideBar from '../components/sidebar/Sidebar'
import TopNavbar from '../components/dashboard/TopNavbar'
import MetricCards from '../components/dashboard/MetricCards'
import AttentionNeeded from '../components/dashboard/AttentionNeeded'
import styles from './Dashboard.module.css'

const DashboardPage = () => {
  return (
    <div className={styles.dashboard}>
      {/* Sidebar */}
      <SideBar />

      {/* Main Content Area */}
      <main className={styles.content}>
        {/* Top Navbar */}
        <TopNavbar />

        {/* 4 Metric Cards */}
        <MetricCards />

        {/* Attention Needed Section */}
        <div className={"mt-10"}>
          <AttentionNeeded />
        </div>
      </main>
    </div>
  )
}

export default DashboardPage