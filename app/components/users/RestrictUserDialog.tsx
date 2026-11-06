'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { ErrorState, InlineSpinner } from '../common/AsyncState'
import { errorMessage } from '../../lib/api/client'
import styles from './RestrictUserDialog.module.css'

export type Restriction = 'BANNED' | 'SUSPENDED'

interface RestrictUserDialogProps {
  /** Name of the user to restrict; `null` hides the dialog. */
  userName: string | null
  onClose: () => void
  /** Performs the status change; the dialog closes when it resolves. */
  onConfirm: (status: Restriction) => Promise<void>
}

export const RestrictUserDialog: React.FC<RestrictUserDialogProps> = ({ userName, onClose, onConfirm }) => {
  if (!userName) return null
  return <Dialog key={userName} userName={userName} onClose={onClose} onConfirm={onConfirm} />
}

const Dialog: React.FC<RestrictUserDialogProps & { userName: string }> = ({ userName, onClose, onConfirm }) => {
  const [busy, setBusy] = useState<Restriction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const confirm = async (status: Restriction) => {
    setBusy(status)
    setError(null)
    try {
      await onConfirm(status)
      onClose()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(null)
    }
  }

  return (
    <div className={styles.overlay} onClick={() => !busy && onClose()}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="restrict-title"
        aria-describedby="restrict-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <span className={styles.iconCircle} aria-hidden="true">
          <ShieldAlert />
        </span>
        <h2 id="restrict-title" className={styles.title}>
          Are you sure you want to ban this user?
        </h2>
        <p id="restrict-desc" className={styles.desc}>
          <strong>{userName}</strong> will lose access to Gathr. Choose how strict this should be:
        </p>

        <ul className={styles.options}>
          <li>
            <strong>Ban</strong> — permanent removal for serious or repeated violations.
          </li>
          <li>
            <strong>Suspend</strong> — temporary hold while you investigate. Easy to lift later.
          </li>
        </ul>

        {error && <ErrorState message={error} compact />}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.suspend}
            onClick={() => confirm('SUSPENDED')}
            disabled={busy !== null}
          >
            {busy === 'SUSPENDED' && <InlineSpinner />} Suspend
          </button>
          <button
            type="button"
            className={styles.ban}
            onClick={() => confirm('BANNED')}
            disabled={busy !== null}
          >
            {busy === 'BANNED' && <InlineSpinner />} Ban
          </button>
        </div>
        <button
          ref={cancelRef}
          type="button"
          className={styles.cancel}
          onClick={onClose}
          disabled={busy !== null}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default RestrictUserDialog
