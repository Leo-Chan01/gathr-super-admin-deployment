import React, { Suspense } from 'react'
import UsersBoard from '../components/users/UsersBoard'
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

      {/* UsersBoard reads ?tab= via useSearchParams, which needs a Suspense boundary. */}
      <Suspense>
        <UsersBoard />
      </Suspense>
    </div>
  )
}

export default UsersPage
