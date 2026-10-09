import { WithdrawalItem } from '../dashboard/WithdrawalCard'

export type ActivityGroup = string

export interface WalletRequest extends WithdrawalItem {
  signedAmount: number
  group: ActivityGroup
  ageDays: number
}

export const walletSummary = {
  availableBalance: '$27,008,965.09',
  totalPayoutsSent: '$7,148,965.27'
}

export const payoutSeries = {
  labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  payouts: [88, 96, 108, 102, 118, 132, 128, 146, 158, 174, 202, 246],
  withdrawals: [64, 72, 78, 82, 80, 92, 96, 104, 112, 124, 138, 156]
}

const earlierPhoto =
  'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=150&auto=format&fit=crop&q=80'

const earlierActivity: WalletRequest[] = [
  ['w-7', 'Lena Ortiz', 'Creator', 3200, 3, 'Oct 6'],
  ['w-8', 'Harbor Clinic', 'Non-profit', -8600, 3, 'Oct 6'],
  ['w-9', 'Noah Patel', 'Individual', -1400, 4, 'Oct 5'],
  ['w-10', 'Bright Path School', 'Non-profit', 15000, 5, 'Oct 4'],
  ['w-11', 'Mina Cole', 'Individual', -980, 5, 'Oct 4'],
  ['w-12', 'Northside Fund', 'Non-profit', -6400, 6, 'Oct 3'],
  ['w-13', 'Chris Adeyemi', 'Creator', 7200, 10, 'Sep 29'],
  ['w-14', 'River Trust', 'Non-profit', -4100, 10, 'Sep 29'],
  ['w-15', 'Elena Voss', 'Individual', -2200, 12, 'Sep 27'],
  ['w-16', 'Open Kitchen', 'Non-profit', 5400, 15, 'Sep 24'],
  ['w-17', 'Sam Okonkwo', 'Individual', -1750, 18, 'Sep 21'],
  ['w-18', 'Field Notes', 'Creator', -890, 21, 'Sep 18'],
  ['w-19', 'Imani Brooks', 'Individual', -3600, 2, 'Oct 7'],
  ['w-20', 'Cedar House', 'Non-profit', -11250, 2, 'Oct 7']
].map(([id, name, category, signedAmount, ageDays, group]) => {
  const amount = signedAmount as number
  const formatted = Math.abs(amount).toLocaleString('en-US')
  return {
    id: id as string,
    name: name as string,
    category: category as string,
    timeAgo: `${ageDays}d ago`,
    amount: `${amount > 0 ? '+' : ''}$${formatted}`,
    signedAmount: amount,
    group: group as string,
    ageDays: ageDays as number,
    bankName: 'GTBank',
    accountLast4: '4412',
    walletType: amount < 0 ? 'Campaign wallet' : 'Personal wallet',
    campaignName: 'Recent payout activity',
    thumbnailUrl: earlierPhoto
  }
})

export const walletRequests: WalletRequest[] = [
  {
    id: 'w-1',
    name: 'The Mindgeek Collective',
    category: 'Non-profit',
    timeAgo: '2hrs ago',
    amount: '$150,000',
    signedAmount: -150000,
    group: 'Today',
    ageDays: 0,
    bankName: 'Wema Bank',
    accountLast4: '6734',
    walletType: 'Campaign wallet',
    campaignName: 'Help Alex raise the money for his surgery',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'w-2',
    name: 'J. Drake',
    category: 'Individual',
    timeAgo: '4hrs ago',
    amount: '$2,500',
    signedAmount: -2500,
    group: 'Today',
    ageDays: 0,
    bankName: 'GTBank',
    accountLast4: '4412',
    walletType: 'Personal wallet',
    campaignName: 'Emergency medical support for Lucas',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'w-3',
    name: 'A. Kim',
    category: 'Creator',
    timeAgo: '6hrs ago',
    amount: '+$10,000',
    signedAmount: 10000,
    group: 'Today',
    ageDays: 0,
    bankName: 'Access Bank',
    accountLast4: '8821',
    walletType: 'Campaign wallet',
    campaignName: 'Scholarship endowment for tech students',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'w-4',
    name: 'R. Johnston',
    category: 'Non-profit',
    timeAgo: '8hrs ago',
    amount: '$9,000',
    signedAmount: -9000,
    group: 'Today',
    ageDays: 0,
    bankName: 'Zenith Bank',
    accountLast4: '1093',
    walletType: 'Campaign wallet',
    campaignName: 'Clean water initiative for rural schools',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'w-5',
    name: 'Springfield Community',
    category: 'Non-profit',
    timeAgo: '1d ago',
    amount: '$12,400',
    signedAmount: -12400,
    group: 'Yesterday',
    ageDays: 1,
    bankName: 'First Bank',
    accountLast4: '5567',
    walletType: 'Campaign wallet',
    campaignName: 'Rebuild the Springfield Community Center',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'w-6',
    name: 'David Ross',
    category: 'Individual',
    timeAgo: '1d ago',
    amount: '+$4,800',
    signedAmount: 4800,
    group: 'Yesterday',
    ageDays: 1,
    bankName: 'UBA',
    accountLast4: '2209',
    walletType: 'Personal wallet',
    campaignName: 'Animal shelter expansion project',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=150&auto=format&fit=crop&q=80'
  },
  ...earlierActivity
]
