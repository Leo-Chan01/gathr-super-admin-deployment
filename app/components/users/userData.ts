import type { MetricItem } from '../dashboard/MetricCards'
import type { KYCItem } from '../dashboard/KYCCard'

export type UserTab = 'individuals' | 'organizations' | 'pending'
export type AccountStatus = 'active' | 'blocked'
export type OrgCategory = 'for-profit' | 'non-profit'
export type UserFilter = 'all' | AccountStatus | OrgCategory

export interface IndividualUser {
  id: string
  userNo: string
  name: string
  phone: string
  email: string
  joined: string
  status: AccountStatus
  blocked: boolean
}

export interface OrganizationUser {
  id: string
  name: string
  category: OrgCategory
  email: string
  joined: string
  status: AccountStatus
  blocked: boolean
}

export interface PendingOrganization {
  id: string
  name: string
  category: OrgCategory
  email: string
  submitted: string
}

export const userMetrics: MetricItem[] = [
  {
    title: 'Total users',
    value: '25k',
    change: '+6.08%',
    isPositive: true,
    tone: 'blue'
  },
  {
    title: 'Active users',
    value: '23.2k',
    change: '+6.08%',
    isPositive: true,
    tone: 'green'
  },
  {
    title: 'Pending verification',
    value: '780',
    change: '+6.08%',
    isPositive: false,
    tone: 'gray'
  },
  {
    title: 'Blocked users',
    value: '240',
    change: '+6.08%',
    isPositive: true,
    tone: 'pink'
  }
]

export const individualUsers: IndividualUser[] = [
  ['20', 'Miya Das', '+1 41472059670', 'Miya@sky.link', '30/7/2026', 'active'],
  ['41', 'Shreya Pandal', '+1 98272759670', 'Shreya@dian.com', '5/5/2026', 'active'],
  ['45', 'Sunny Marsha', '+1 82522041510', 'Sunny@gmail.com', '7/9/2026', 'active'],
  ['32', 'Neha Gupta', '+1 75412059541', 'Neha@racfq.com', '16/5/2026', 'active'],
  ['21', 'Daisy Mores', '+1 8356596708', 'Daisy@bou.com', '7/8/2026', 'active'],
  ['70', 'Kitya Kotwa', '+1 78452320156', 'Kitya@kai.com', '12/3/2026', 'active'],
  ['19', 'Jiya Haldawani', '+1 41527952231', 'Jiya@hulas.co', '19/1/2026', 'active'],
  ['33', 'Loid Fernandes', '+1 21045874263', 'Loid@hulas.co', '6/6/2026', 'active'],
  ['14', 'Piya Gupta', '+1 52412059670', 'Piya@racfq.com', '17/2/2026', 'active'],
  ['16', 'Irish Sowagh', '+1 25262059670', 'Irish@dian.com', '21/1/2026', 'active'],
  ['35', 'Fatima Shaik', '+1 45272059670', 'Fatima@mail.com', '9/12/2025', 'blocked'],
  ['51', 'Zero firdt', '+1 71125059670', 'Zero@dinn.com', '4/1/2024', 'blocked']
].map(([userNo, name, phone, email, joined, status]) => ({
  id: `user-${userNo}`,
  userNo,
  name,
  phone,
  email,
  joined,
  status: status as AccountStatus,
  blocked: status === 'blocked'
}))

const orgPattern: Array<Pick<OrganizationUser, 'category' | 'email' | 'joined'>> = [
  { category: 'for-profit', email: 'Miya@sky.link', joined: '30/7/2026' },
  { category: 'non-profit', email: 'Shreya@dian.com', joined: '5/5/2026' }
]

export const organizationUsers: OrganizationUser[] = Array.from({ length: 14 }, (_, index) => {
  const sample = orgPattern[index % orgPattern.length]
  return {
    id: `org-${index + 1}`,
    name: 'The Reachout org',
    category: sample.category,
    email: sample.email,
    joined: sample.joined,
    status: 'active',
    blocked: index === 3
  }
})

export const pendingOrganizations: PendingOrganization[] = organizationUsers.map((org) => ({
  id: `pending-${org.id}`,
  name: org.name,
  category: org.category,
  email: org.email,
  submitted: org.joined
}))

export const categoryLabel: Record<OrgCategory, string> = {
  'for-profit': 'For-profit',
  'non-profit': 'Non-profit'
}

export const toKycItem = (org: PendingOrganization): KYCItem => ({
  id: org.id,
  name: org.name,
  category: categoryLabel[org.category],
  timeAgo: org.submitted,
  docsSubmitted: 2,
  totalDocs: 2,
  documents: [
    {
      id: `${org.id}-tin`,
      title: 'TIN Document',
      fileType: 'PDF',
      fileSize: '2.4 MB',
      status: 'Uploaded'
    },
    {
      id: `${org.id}-cert`,
      title: 'Certificate of Incorporation',
      fileType: 'PDF',
      fileSize: '1.8 MB',
      status: 'Uploaded'
    }
  ]
})
