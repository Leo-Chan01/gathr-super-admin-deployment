import React from 'react'
import SupportDesk from '../components/support/SupportDesk'
import styles from '../reports/Reports.module.css'

const HelpSupportPage = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Help &amp; Support</h1>
        <p className={styles.subtitle}>
          Triage support tickets, reply to users, and keep private notes for the team.
        </p>
      </header>

      <SupportDesk />
    </div>
  )
}

export default HelpSupportPage
