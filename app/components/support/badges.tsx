import React from 'react'
import type { TicketPriority, TicketStatus } from '../../lib/api/support'
import styles from './Support.module.css'

export const humanize = (value?: string | null) =>
  value ? value.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : ''

const STATUS_CLASS: Record<TicketStatus, string> = {
  OPEN: styles.statusOpen,
  IN_PROGRESS: styles.statusProgress,
  WAITING_FOR_USER: styles.statusWaiting,
  RESOLVED: styles.statusResolved,
  CLOSED: styles.statusClosed
}

export const StatusBadge: React.FC<{ status: TicketStatus; archived?: boolean }> = ({ status, archived }) => (
  <span className={`${styles.statusBadge} ${archived ? styles.statusClosed : STATUS_CLASS[status]}`}>
    {archived ? 'Archived' : status === 'WAITING_FOR_USER' ? 'Waiting on user' : humanize(status)}
  </span>
)

const PRIORITY_CLASS: Record<TicketPriority, string> = {
  LOW: styles.priorityLow,
  NORMAL: styles.priorityNormal,
  HIGH: styles.priorityHigh,
  URGENT: styles.priorityUrgent
}

export const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => (
  <span className={styles.priority}>
    <span className={`${styles.priorityDot} ${PRIORITY_CLASS[priority]}`} aria-hidden="true" />
    {humanize(priority)}
  </span>
)
