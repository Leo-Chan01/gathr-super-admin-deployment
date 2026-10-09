import type { MetricItem } from '../dashboard/MetricCards'
import type { FlaggedItem } from '../dashboard/FlaggedCard'

export type ReportStatus = 'pending' | 'resolved' | 'removed'

export interface ReportItem extends FlaggedItem {
  status: ReportStatus
}

export const reportMetrics: MetricItem[] = [
  {
    title: 'Total flagged posts',
    value: '1,280',
    change: '+4.2%',
    isPositive: true,
    tone: 'blue'
  },
  {
    title: 'Pending review',
    value: '142',
    change: '+6.08%',
    isPositive: true,
    tone: 'green'
  },
  {
    title: 'Resolved',
    value: '1,085',
    change: '+6.08%',
    isPositive: false,
    tone: 'gray'
  },
  {
    title: 'Removed content',
    value: '53',
    change: '+4.1%',
    isPositive: true,
    tone: 'pink'
  }
]

const avatarUrl =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'

const targetImage =
  'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=300&auto=format&fit=crop&q=80'

export const reportItems: ReportItem[] = Array.from({ length: 12 }, (_, index) => ({
  id: `report-${index + 1}`,
  username: '@ademide_jerry',
  name: 'Ademide Jerry',
  timeAgo: '2hrs ago',
  comment: 'This is actually really despicable. Racist content shoul...',
  hasMoreComment: true,
  targetTitle:
    index % 3 === 1
      ? 'A close friend named Alex is in need of immediate surgery.surgery, surgery surgerysurgery surgery surgery'
      : 'A close friend named Alex is in need of immediate surgery.',
  avatarUrl,
  targetImage,
  status: 'pending'
}))
