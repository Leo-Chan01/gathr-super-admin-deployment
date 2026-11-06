'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Archive, Lock, RotateCcw, Send, X } from 'lucide-react'
import AvatarIllustration from '../dashboard/AvatarIllustration'
import { ErrorState, InlineSpinner } from '../common/AsyncState'
import { errorMessage } from '../../lib/api/client'
import { timeAgo } from '../../lib/api/adapters'
import {
  addTicketNote,
  archiveTicket,
  getTicket,
  listMessages,
  profileName,
  replyToTicket,
  restoreTicket,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  updateTicket,
  type SupportMessage,
  type SupportProfile,
  type SupportTicket,
  type TicketUpdate
} from '../../lib/api/support'
import { useResource } from '../../lib/hooks/useResource'
import { humanize, StatusBadge } from './badges'
import drawer from '../dashboard/KYCDetailDrawer.module.css'
import styles from './Support.module.css'

interface TicketDrawerProps {
  ticketId: string | null
  assignees: SupportProfile[]
  onClose: () => void
  /** Updated ticket, or `removedId` when it left the current list (archive/restore). */
  onChange: (ticket: SupportTicket | null, removedId?: string) => void
}

export const TicketDrawer: React.FC<TicketDrawerProps> = ({ ticketId, ...rest }) => {
  if (!ticketId) return null
  return <Panel key={ticketId} ticketId={ticketId} {...rest} />
}

type ComposeMode = 'reply' | 'note'

const Panel: React.FC<Omit<TicketDrawerProps, 'ticketId'> & { ticketId: string }> = ({
  ticketId,
  assignees,
  onClose,
  onChange
}) => {
  const ticket = useResource((signal) => getTicket(ticketId, { signal }), [ticketId])
  const messages = useResource((signal) => listMessages(ticketId, { signal }), [ticketId])
  const [mode, setMode] = useState<ComposeMode>('reply')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState<keyof TicketUpdate | 'archive' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const threadEnd = useRef<HTMLDivElement>(null)
  const data = ticket.data

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ block: 'end' })
  }, [messages.data?.length])

  const update = async (field: keyof TicketUpdate, patch: TicketUpdate) => {
    if (!data) return
    const previous = data
    setSaving(field)
    setError(null)
    // Optimistic; the response replaces it.
    const assignee =
      'assigneeId' in patch ? assignees.find((profile) => profile.id === patch.assigneeId) ?? null : data.assignee
    ticket.mutate((current) => (current ? { ...current, ...patch, assignee } as SupportTicket : current))
    try {
      const saved = await updateTicket(data.id, patch)
      const next = saved && typeof saved === 'object' && 'id' in saved ? saved : { ...previous, ...patch, assignee }
      ticket.mutate(() => next as SupportTicket)
      onChange(next as SupportTicket)
    } catch (err) {
      ticket.mutate(() => previous)
      setError(errorMessage(err))
    } finally {
      setSaving(null)
    }
  }

  const send = async (event: React.FormEvent) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !data || sending) return
    setSending(true)
    setError(null)
    try {
      const message = mode === 'reply' ? await replyToTicket(data.id, content) : await addTicketNote(data.id, content)
      messages.mutate((current) => [...(current ?? []), message])
      setDraft('')
      if (mode === 'reply') {
        const next = { ...data, status: 'WAITING_FOR_USER' as const, _count: { messages: data._count.messages + 1 } }
        ticket.mutate(() => next)
        onChange(next)
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const toggleArchive = async () => {
    if (!data) return
    setSaving('archive')
    setError(null)
    try {
      if (data.archivedAt) await restoreTicket(data.id)
      else await archiveTicket(data.id)
      onChange(null, data.id)
      onClose()
    } catch (err) {
      setError(errorMessage(err))
      setSaving(null)
    }
  }

  return (
    <div className={drawer.overlay} onClick={onClose}>
      <div
        className={`${drawer.drawer} ${styles.ticketDrawer}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={data?.subject ?? 'Support ticket'}
      >
        <div className={drawer.header}>
          <div className={drawer.headerLeft}>
            {data?.requester?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.requester.avatar} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
            ) : (
              <AvatarIllustration />
            )}
            <div className={drawer.headerInfo}>
              <h2 className={drawer.title}>{data?.subject ?? 'Loading ticket…'}</h2>
              {data && (
                <div className={drawer.metaRow}>
                  <span className={drawer.timeAgo}>
                    {profileName(data.requester)}
                    {data.requester.email ? ` · ${data.requester.email}` : ''} · opened {timeAgo(data.createdAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button type="button" className={drawer.closeButton} onClick={onClose} aria-label="Close ticket">
            <X className={drawer.closeIcon} />
          </button>
        </div>

        {ticket.error && <ErrorState message={ticket.error} onRetry={ticket.reload} />}

        {data && (
          <div className={styles.fields}>
            <Field label="Status" busy={saving === 'status'}>
              <select
                value={data.status}
                disabled={saving !== null}
                onChange={(event) => update('status', { status: event.target.value as SupportTicket['status'] })}
              >
                {TICKET_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value === 'WAITING_FOR_USER' ? 'Waiting on user' : humanize(value)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority" busy={saving === 'priority'}>
              <select
                value={data.priority}
                disabled={saving !== null}
                onChange={(event) => update('priority', { priority: event.target.value as SupportTicket['priority'] })}
              >
                {TICKET_PRIORITIES.map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category" busy={saving === 'category'}>
              <select
                value={data.category}
                disabled={saving !== null}
                onChange={(event) => update('category', { category: event.target.value as SupportTicket['category'] })}
              >
                {TICKET_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assignee" busy={saving === 'assigneeId'}>
              <select
                value={data.assigneeId ?? ''}
                disabled={saving !== null}
                onChange={(event) => update('assigneeId', { assigneeId: event.target.value || null })}
              >
                <option value="">Unassigned</option>
                {assignees.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profileName(profile)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}

        <div className={styles.thread} aria-live="polite">
          {messages.error && <ErrorState message={messages.error} onRetry={messages.reload} compact />}
          {messages.loading && !messages.data && (
            <p className={styles.muted}>
              <InlineSpinner /> Loading conversation…
            </p>
          )}
          {messages.data?.length === 0 && <p className={styles.muted}>No messages yet.</p>}
          {messages.data?.map((message) => <Bubble key={message.id} message={message} />)}
          <div ref={threadEnd} />
        </div>

        {error && <ErrorState message={error} compact />}

        {data && !data.archivedAt && (
          <form className={`${styles.composer} ${mode === 'note' ? styles.composerNote : ''}`} onSubmit={send}>
            <div className={styles.modeSwitch} role="radiogroup" aria-label="Message type">
              <button
                type="button"
                role="radio"
                aria-checked={mode === 'reply'}
                className={`${styles.modeButton} ${mode === 'reply' ? styles.modeActive : ''}`}
                onClick={() => setMode('reply')}
              >
                Reply
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={mode === 'note'}
                className={`${styles.modeButton} ${mode === 'note' ? styles.modeActiveNote : ''}`}
                onClick={() => setMode('note')}
              >
                <Lock aria-hidden="true" /> Private note
              </button>
            </div>
            <textarea
              className={styles.composerInput}
              rows={3}
              value={draft}
              disabled={sending}
              placeholder={
                mode === 'reply'
                  ? `Reply to ${profileName(data.requester)} — ticket moves to “Waiting on user”`
                  : 'Only staff can see notes'
              }
              aria-label={mode === 'reply' ? 'Reply' : 'Private note'}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) send(event)
              }}
            />
            <div className={styles.composerFooter}>
              <span className={styles.muted}>⌘/Ctrl + Enter to send</span>
              <button type="submit" className={styles.sendButton} disabled={sending || !draft.trim()}>
                {sending ? <InlineSpinner /> : <Send aria-hidden="true" />}
                {mode === 'reply' ? 'Send reply' : 'Add note'}
              </button>
            </div>
          </form>
        )}

        <div className={drawer.footerActions}>
          {data && <StatusBadge status={data.status} archived={Boolean(data.archivedAt)} />}
          {data && (
            <button
              type="button"
              className={drawer.cancelRejectButton}
              onClick={toggleArchive}
              disabled={saving !== null}
            >
              {saving === 'archive' ? (
                <InlineSpinner />
              ) : data.archivedAt ? (
                <RotateCcw className={styles.inlineIcon} aria-hidden="true" />
              ) : (
                <Archive className={styles.inlineIcon} aria-hidden="true" />
              )}{' '}
              {data.archivedAt ? 'Restore ticket' : 'Archive ticket'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const Field: React.FC<{ label: string; busy: boolean; children: React.ReactNode }> = ({ label, busy, children }) => (
  <label className={styles.field}>
    <span className={styles.fieldLabel}>
      {label} {busy && <InlineSpinner />}
    </span>
    {children}
  </label>
)

const Bubble: React.FC<{ message: SupportMessage }> = ({ message }) => {
  const side = message.isStaff ? styles.bubbleStaff : styles.bubbleUser
  return (
    <div className={`${styles.bubbleRow} ${message.isStaff ? styles.bubbleRowStaff : ''}`}>
      <div className={`${styles.bubble} ${message.isInternal ? styles.bubbleNote : side}`}>
        <p className={styles.bubbleMeta}>
          {message.isInternal && (
            <span className={styles.noteTag}>
              <Lock aria-hidden="true" /> Private note
            </span>
          )}
          <strong>{profileName(message.author)}</strong> · {timeAgo(message.createdAt)}
        </p>
        <p className={styles.bubbleText}>{message.content}</p>
        {message.attachmentUrls && message.attachmentUrls.length > 0 && (
          <ul className={styles.attachments}>
            {message.attachmentUrls.map((url, index) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Attachment {index + 1}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default TicketDrawer
