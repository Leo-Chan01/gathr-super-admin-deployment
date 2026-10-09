import React from 'react'
import MetricCards from '../components/dashboard/MetricCards'
import UsersBoard from '../components/users/UsersBoard'
import { userMetrics } from '../components/users/userData'
import styles from './Users.module.css'

const UsersPage = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Users</h1>
        <p className={styles.subtitle}>
          Monitor user engagement, oversee community interactions, and analyze platform activity.
        </p>
      </header>

      <MetricCards metrics={userMetrics} />
      <UsersBoard />
    </div>
  )
}

export default UsersPage
