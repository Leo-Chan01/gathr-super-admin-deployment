// View models for the live feed. Data comes from app/lib/api/feed.ts;
// the profile types/mocks below are only used by ProfileDrawer.

export type FeedTab = 'impact' | 'gathr' | 'communities' | 'events'
/** Maps to the gathr `postType` filter. */
export type GathrFilter = 'all' | 'offers' | 'requests'
export type BroadcastAudience = 'all' | FeedTab

export interface FeedPost {
  id: string
  tab: FeedTab
  /** Entity type for interactions (likes, comments). */
  entityType: 'IMPACT_POST' | 'GATHR' | 'COMMUNITY' | 'EVENT'
  /** Author / creator user ID — links to /users/[id]. */
  userId: string
  gathrKind?: Exclude<GathrFilter, 'all'>
  username: string
  location: string
  verified: boolean
  avatarUrl?: string
  title?: string
  caption: string
  images: string[]
  likes: number
  comments: number
  liked: boolean
  /** One-line summary under the caption (progress, members, date…). */
  meta?: string
  status?: string
  featured?: boolean
}

export interface FeedReply {
  id: string
  userId?: string
  username: string
  avatarUrl?: string
  time: string
  body: string
  likes: number
  liked: boolean
  /** Shown in the reply pill; defaults to nested replies */
  replyCount?: number
  replies?: FeedReply[]
}

export interface FeedComment extends FeedReply {
  postId: string
  replies: FeedReply[]
}

export type ReviewRelation = 'Donated to' | 'Received from' | 'Attended'

export interface ProfileReview {
  id: string
  username: string
  avatarUrl: string
  relation: ReviewRelation
  body: string
  likes: number
  comments: number
  liked: boolean
}

export interface UserProfile {
  username: string
  name: string
  rating: number
  bio: string
  location: string
  since: string
  causes: string[]
  following: string
  followers: string
  karma: string
  avatarUrl: string
  coverUrl: string
  feedbackScore: number
  feedbackCount: number
  reviews: ProfileReview[]
}

// Sample profile data for ProfileDrawer only.
const joshuaAvatar =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
const emilyAvatar =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
const coverUrl =
  'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1400&auto=format&fit=crop&q=80'
const fredrickAvatar =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
const frankAvatar =
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80'
const guillermoAvatar =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'

const reviewsFor = (handle: string): ProfileReview[] => {
  const body = `Kudos to ${handle} the Reachout Collective for an outstanding campaign! Your transparency and prompt updates to donors through impactful posts have been remarkable. It's inspiring to witness the positive effects of your hard work!`
  return [
    {
      id: `${handle}-donated`,
      username: '@fredrick',
      avatarUrl: fredrickAvatar,
      relation: 'Donated to',
      body,
      likes: 40200,
      comments: 593,
      liked: true
    },
    {
      id: `${handle}-received`,
      username: '@frankSinatra',
      avatarUrl: frankAvatar,
      relation: 'Received from',
      body,
      likes: 40200,
      comments: 593,
      liked: true
    },
    {
      id: `${handle}-attended`,
      username: '@guillermo',
      avatarUrl: guillermoAvatar,
      relation: 'Attended',
      body,
      likes: 1860,
      comments: 42,
      liked: false
    }
  ]
}

const profile = (
  entry: Omit<UserProfile, 'coverUrl' | 'reviews' | 'feedbackScore' | 'feedbackCount'> &
    Partial<Pick<UserProfile, 'coverUrl' | 'feedbackScore' | 'feedbackCount'>>
): UserProfile => ({
  coverUrl,
  feedbackScore: 4.7,
  feedbackCount: 229,
  ...entry,
  reviews: reviewsFor(entry.username)
})

export const userProfiles: UserProfile[] = [
  profile({
    username: '@joshua_l',
    name: 'Joshua Lee',
    rating: 4.7,
    bio: 'Documenting school repairs and classroom drives across Dansal. Based in Tokyo, building with the communities the work is for.',
    location: 'Tokyo, Japan',
    since: 'Since Mar, 2024',
    causes: [
      'Education',
      'Poverty & Hunger',
      'Health',
      'Community',
      'Water',
      'Housing',
      'Youth',
      'Climate',
      'Food'
    ],
    following: '32',
    followers: '1.5m',
    karma: '2.5k',
    avatarUrl: joshuaAvatar
  }),
  profile({
    username: '@gathr_hq',
    name: 'Gathr HQ',
    rating: 4.9,
    bio: 'Official updates from Gathr. Funding goals, community milestones, and the people behind them.',
    location: 'Lagos, Nigeria',
    since: 'Since Jan, 2023',
    causes: ['Community', 'Education', 'Health'],
    following: '120',
    followers: '860k',
    karma: '18k',
    avatarUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80'
  }),
  profile({
    username: '@amina_k',
    name: 'Amina K',
    rating: 4.8,
    bio: 'Campaigns for clean water and rural schools. Nairobi based, field most weeks.',
    location: 'Nairobi, Kenya',
    since: 'Since Jun, 2024',
    causes: ['Water', 'Education', 'Health', 'Community'],
    following: '64',
    followers: '92k',
    karma: '4.1k',
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80'
  }),
  profile({
    username: '@green_earth',
    name: 'Green Earth',
    rating: 4.6,
    bio: 'Community gardens and local food projects. Growing with neighbors, one plot at a time.',
    location: 'Accra, Ghana',
    since: 'Since Aug, 2023',
    causes: ['Climate', 'Food', 'Community'],
    following: '41',
    followers: '54k',
    karma: '3.2k',
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80'
  }),
  profile({
    username: '@gathr_events',
    name: 'Gathr Events',
    rating: 4.5,
    bio: 'Live fundraisers and community gatherings. Bring a neighbor, share a cause.',
    location: 'Online',
    since: 'Since Oct, 2024',
    causes: ['Community', 'Education'],
    following: '18',
    followers: '21k',
    karma: '980',
    avatarUrl:
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&auto=format&fit=crop&q=80'
  }),
  profile({
    username: '@emily_s',
    name: 'Emily S',
    rating: 4.7,
    bio: 'Shows up for clean-ups, classrooms, and the people organizing them.',
    location: 'Tokyo, Japan',
    since: 'Since Oct, 2025',
    causes: ['Community', 'Education', 'Climate'],
    following: '28',
    followers: '12k',
    karma: '860',
    avatarUrl: emilyAvatar
  })
]

export const getProfile = (username: string): UserProfile => {
  const handle = username.startsWith('@') ? username : `@${username}`
  const found = userProfiles.find((entry) => entry.username === handle)
  if (found) return found
  const label = handle.slice(1).replace(/[_]+/g, ' ')
  return profile({
    username: handle,
    name: label.charAt(0).toUpperCase() + label.slice(1),
    rating: 4.7,
    bio: 'Part of the Gathr community.',
    location: 'Gathr',
    since: 'Since Oct, 2026',
    causes: ['Community', 'Education'],
    following: '12',
    followers: '1.2k',
    karma: '240',
    avatarUrl: joshuaAvatar
  })
}

export const formatCount = (value: number) => {
  if (value >= 1000) {
    const compact = value / 1000
    const digits = compact >= 100 ? 0 : 1
    return `${compact.toFixed(digits).replace(/\.0$/, '')}k`
  }
  return value.toLocaleString('en-US')
}
