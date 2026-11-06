import React from 'react'
import NotificationsInbox from '../components/notifications/NotificationsInbox'
import styles from '../reports/Reports.module.css'

const NotificationsPage = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Notifications</h1>
        <p className={styles.subtitle}>Alerts about reports, verifications, payouts and support activity.</p>
      </header>

      <NotificationsInbox />
    </div>
  )
}

export default NotificationsPage
