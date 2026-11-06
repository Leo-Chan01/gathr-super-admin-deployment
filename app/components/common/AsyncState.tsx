'use client'

import React from 'react'
import { AlertCircle, RotateCw } from 'lucide-react'
import styles from './AsyncState.module.css'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  compact?: boolean
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, compact }) => (
  <div className={`${styles.error} ${compact ? styles.compact : ''}`} role="alert">
    <AlertCircle className={styles.errorIcon} aria-hidden="true" />
    <span className={styles.errorText}>{message}</span>
    {onRetry && (
      <button type="button" className={styles.retry} onClick={onRetry}>
        <RotateCw className={styles.retryIcon} aria-hidden="true" />
        Retry
      </button>
    )}
  </div>
)

/** Grid of shimmering placeholders shaped like the cards they stand in for. */
export const SkeletonGrid: React.FC<{ count: number; className?: string; height?: number }> = ({
  count,
  className,
  height = 120
}) => (
  <div className={className} aria-busy="true" aria-label="Loading">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className={styles.skeleton} style={{ height }} />
    ))}
  </div>
)

export const SkeletonRows: React.FC<{ rows: number; columns: number }> = ({ rows, columns }) => (
  <>
    {Array.from({ length: rows }, (_, row) => (
      <tr key={row} aria-hidden="true">
        {Array.from({ length: columns }, (_, column) => (
          <td key={column}>
            <span className={styles.skeletonLine} />
          </td>
        ))}
      </tr>
    ))}
  </>
)

export const InlineSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <span className={`${styles.spinner} ${className ?? ''}`} aria-hidden="true" />
)

export default ErrorState
