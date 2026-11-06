'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Headphones,
  Newspaper,
  ShieldCheck,
  Wallet,
  X
} from 'lucide-react'
import { ErrorState, InlineSpinner } from '../common/AsyncState'
import { useTabIndicator } from '../motion/useMotion'
import { timeAgo } from '../../lib/api/adapters'
import { errorMessage } from '../../lib/api/client'
import {
  announceUnreadChange,
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllRead,
  markRead,
  type AppNotification
} from '../../lib/api/notifications'
import { useResource } from '../../lib/hooks/useResource'
import board from '../users/UsersBoard.module.css'
import styles from './Notifications.module.css'

type Filter = 'all' | 'unread'
const PAGE_SIZE = 20

const iconFor = (item: AppNotification) => {
  switch (item.href) {
    case '/reports':
      return <AlertTriangle aria-hidden="true" />
    case '/users?tab=pending':
      return <ShieldCheck aria-hidden="true" />
    case '/wallets':
      return <Wallet aria-hidden="true" />
    case '/help-support':
      return <Headphones aria-hidden="true" />
    case '/gathr-feed':
      return <Newspaper aria-hidden="true" />
    default:
      return <Bell aria-hidden="true" />
  }
}

const dayLabel = (iso?: string) => {
  if (!iso) return 'Earlier'
  const date = new Date(iso)
  const today = new Date()
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = Math.round((startOf(today) - startOf(date)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return 'This week'
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export const NotificationsInbox: React.FC = () => {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const { tabsRef, indicator } = useTabIndicator(filter)
  const [pages, setPages] = useState(1)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const unread = useResource((signal) => getUnreadCount({ signal }), [])
  // Re-fetches pages 1..n together so "Load more" stays consistent after edits.
  const inbox = useResource(
    async (signal) => {
      const results = await Promise.all(
        Array.from({ length: pages }, (_, index) => listNotifications(index + 1, PAGE_SIZE, { signal }))
      )
      const seen = new Set<string>()
      const items = results.flatMap((result) => result.items).filter((item) => !seen.has(item.id) && seen.add(item.id))
      return { items, meta: results[results.length - 1].meta }
    },
    [pages]
  )

  const items = inbox.data?.items ?? []
  const visible = filter === 'unread' ? items.filter((item) => !item.read) : items
  const groups = visible.reduce<{ label: string; items: AppNotification[] }[]>((acc, item) => {
    const label = dayLabel(item.createdAt)
    const last = acc[acc.length - 1]
    if (last?.label === label) last.items.push(item)
    else acc.push({ label, items: [item] })
    return acc
  }, [])

  const patch = (id: string, change: Partial<AppNotification> | null) =>
    inbox.mutate((current) =>
      current
        ? {
            ...current,
            items:
              change === null
                ? current.items.filter((item) => item.id !== id)
                : current.items.map((item) => (item.id === id ? { ...item, ...change } : item))
          }
        : current
    )

  const changed = (delta: number) => {
    unread.mutate((count) => Math.max(0, (count ?? 0) + delta))
    announceUnreadChange()
  }

  const open = async (item: AppNotification) => {
    if (!item.read) {
      patch(item.id, { read: true })
      changed(-1)
      markRead(item.id).catch((err) => {
        patch(item.id, { read: false })
        changed(1)
        setActionError(errorMessage(err))
      })
    }
    if (item.href) router.push(item.href)
  }

  const remove = async (item: AppNotification) => {
    setBusyId(item.id)
    setActionError(null)
    try {
      await deleteNotification(item.id)
      patch(item.id, null)
      if (!item.read) changed(-1)
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const readAll = async () => {
    setMarkingAll(true)
    setActionError(null)
    try {
      await markAllRead()
      inbox.mutate((current) =>
        current ? { ...current, items: current.items.map((item) => ({ ...item, read: true })) } : current
      )
      unread.mutate(() => 0)
      announceUnreadChange()
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = unread.data ?? items.filter((item) => !item.read).length

  return (
    <section className={board.board}>
      <div className={styles.toolbar}>
        <div className={board.tabs} role="tablist" aria-label="Notification filter" ref={tabsRef}>
          {indicator.ready && (
            <span
              className={board.tabIndicator}
              style={{ width: indicator.width, transform: `translateX(${indicator.x}px)` }}
            />
          )}
          {(['all', 'unread'] as Filter[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              className={`${board.tab} ${filter === key ? board.tabActive : ''}`}
              onClick={() => setFilter(key)}
            >
              {key === 'all' ? 'All' : `Unread${unreadCount ? ` (${unreadCount})` : ''}`}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={styles.readAll}
          onClick={readAll}
          disabled={markingAll || unreadCount === 0}
        >
          {markingAll ? <InlineSpinner /> : <CheckCheck aria-hidden="true" />}
          Mark all as read
        </button>
      </div>

      {actionError && <ErrorState message={actionError} compact />}

      {inbox.error && !inbox.data ? (
        <ErrorState message={inbox.error} onRetry={inbox.reload} />
      ) : inbox.loading && !inbox.data ? (
        <div className={styles.list} aria-busy="true">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className={styles.skeleton} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className={styles.emptyState}>
          <Bell aria-hidden="true" />
          <p>{filter === 'unread' ? "You're all caught up." : 'No notifications yet.'}</p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.label} className={styles.group}>
            <p className={styles.groupLabel}>{group.label}</p>
            <ul className={styles.list}>
              {group.items.map((item) => (
                <li key={item.id} className={`${styles.item} ${item.read ? '' : styles.unread}`}>
                  <button type="button" className={styles.itemMain} onClick={() => open(item)}>
                    <span className={styles.icon}>{iconFor(item)}</span>
                    <span className={styles.text}>
                      <span className={styles.title}>{item.title}</span>
                      {item.body && <span className={styles.body}>{item.body}</span>}
                      <span className={styles.time}>{timeAgo(item.createdAt)}</span>
                    </span>
                    {!item.read && <span className={styles.dot} aria-label="Unread" />}
                  </button>
                  <button
                    type="button"
                    className={styles.remove}
                    aria-label={`Delete notification: ${item.title}`}
                    disabled={busyId === item.id}
                    onClick={() => remove(item)}
                  >
                    {busyId === item.id ? <InlineSpinner /> : <X aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      {inbox.data?.meta.hasNext && (
        <button
          type="button"
          className={styles.loadMore}
          disabled={inbox.loading}
          onClick={() => setPages((count) => count + 1)}
        >
          {inbox.loading && <InlineSpinner />} Load more
        </button>
      )}
    </section>
  )
}

export default NotificationsInbox
