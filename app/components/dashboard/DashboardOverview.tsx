'use client'

import React from 'react'
import MetricCards from './MetricCards'
import AttentionNeeded from './AttentionNeeded'
import { ErrorState } from '../common/AsyncState'
import { getDashboard } from '../../lib/api/admin'
import { toDashboard } from '../../lib/api/adapters'
import { useResource } from '../../lib/hooks/useResource'

export const DashboardOverview: React.FC = () => {
  const dashboard = useResource((signal) => getDashboard({ signal }).then(toDashboard), [])
  const view = dashboard.data ?? toDashboard(undefined)

  return (
    <>
      {dashboard.error && <ErrorState message={dashboard.error} onRetry={dashboard.reload} compact />}
      <MetricCards metrics={view.metrics} loading={dashboard.loading && !dashboard.data} />

      <div className="mt-2">
        <AttentionNeeded counts={view.counts} onQueueChange={dashboard.reload} />
      </div>
    </>
  )
}

export default DashboardOverview
