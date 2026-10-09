export type FeedTab = 'impact' | 'gathr' | 'communities' | 'events'
export type GathrFilter = 'all' | 'updates' | 'campaigns'
export type BroadcastAudience = 'all' | FeedTab

export interface FeedPost {
  id: string
  tab: FeedTab
  gathrKind?: Exclude<GathrFilter, 'all'>
  username: string
  location: string
  verified: boolean
  avatarUrl: string
  caption: string
  images: string[]
  likes: number
  comments: number
  liked: boolean
}

export interface AttentionItem {
  id: string
  label: string
  href: string
  tone: 'alert' | 'people' | 'payout'
}

export interface ActivityItem {
  id: string
  time: string
  actor: string
  detail: string
}

export interface FeedReply {
  id: string
  username: string
  avatarUrl: string
  time: string
  body: string
  likes: number
  liked: boolean
  /** Shown in the reply pill; defaults to nested replies */
  replyCount?: number
  replies?: FeedReply[]
}

export interface FeedComment {
  id: string
  postId: string
  username: string
  avatarUrl: string
  time: string
  body: string
  likes: number
  liked: boolean
  /** Shown in the comment pill; defaults to nested reply count */
  replyCount?: number
  replies: FeedReply[]
}

export const feedPosts: FeedPost[] = [
  {
    id: 'impact-1',
    tab: 'impact',
    username: '@joshua_l',
    location: 'Tokyo, Japan',
    verified: true,
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    caption: 'Great updates on the school roofing project in Dansal',
    images: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&auto=format&fit=crop&q=80'
    ],
    likes: 40200,
    comments: 600,
    liked: true
  },
  {
    id: 'impact-2',
    tab: 'impact',
    username: '@joshua_l',
    location: 'Tokyo, Japan',
    verified: true,
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    caption: 'Great updates on the school roofing project in Dansal',
    images: [
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&auto=format&fit=crop&q=80'
    ],
    likes: 40200,
    comments: 600,
    liked: true
  },
  {
    id: 'gathr-1',
    tab: 'gathr',
    gathrKind: 'updates',
    username: '@gathr_hq',
    location: 'Lagos, Nigeria',
    verified: true,
    avatarUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80',
    caption: 'Weekly Gathr update: 128 communities crossed their funding goal.',
    images: [
      'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&auto=format&fit=crop&q=80'
    ],
    likes: 8600,
    comments: 142,
    liked: false
  },
  {
    id: 'gathr-2',
    tab: 'gathr',
    gathrKind: 'campaigns',
    username: '@amina_k',
    location: 'Nairobi, Kenya',
    verified: false,
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    caption: 'Campaign spotlight: clean water wells for three rural schools.',
    images: [
      'https://images.unsplash.com/photo-1541844053589-346841d0b34c?w=1200&auto=format&fit=crop&q=80'
    ],
    likes: 12400,
    comments: 310,
    liked: false
  },
  {
    id: 'community-1',
    tab: 'communities',
    username: '@green_earth',
    location: 'Accra, Ghana',
    verified: true,
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
    caption: 'Green Earth Initiative opened a new community garden this morning.',
    images: [
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&auto=format&fit=crop&q=80'
    ],
    likes: 5400,
    comments: 88,
    liked: false
  },
  {
    id: 'event-1',
    tab: 'events',
    username: '@gathr_events',
    location: 'Online',
    verified: true,
    avatarUrl:
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&auto=format&fit=crop&q=80',
    caption: 'Live fundraiser tonight at 7pm. Bring a neighbor, share a cause.',
    images: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80'
    ],
    likes: 2100,
    comments: 46,
    liked: false
  }
]

const verifiedAuthors = new Set(
  feedPosts.filter((post) => post.verified).map((post) => post.username)
)
verifiedAuthors.add('@emily_s')

export const isVerifiedAuthor = (username: string) => verifiedAuthors.has(username)

export const attentionItems: AttentionItem[] = [
  { id: 'reports', label: '12 new reports', href: '/reports', tone: 'alert' },
  {
    id: 'verification',
    label: '5 accounts pending verification',
    href: '/users',
    tone: 'people'
  },
  {
    id: 'payouts',
    label: '78 New payout requests',
    href: '/wallets',
    tone: 'payout'
  }
]

export const initialActivity: ActivityItem[] = [
  {
    id: 'a1',
    time: '20 mins ago',
    actor: 'Green Earth Initiative',
    detail: 'joined as an active affiliate'
  },
  {
    id: 'a2',
    time: '24 mins ago',
    actor: 'Yellorr Earth Initiative',
    detail: 'created a new community'
  },
  {
    id: 'a3',
    time: '10 mins ago',
    actor: 'Green Earth Initiative',
    detail: 'joined as an active affiliate'
  },
  {
    id: 'a4',
    time: '1 hr ago',
    actor: 'The Reachout org',
    detail: 'submitted verification documents'
  },
  {
    id: 'a5',
    time: '2 hrs ago',
    actor: 'Miya Das',
    detail: 'published a new impact update'
  }
]

const joshuaAvatar =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
const emilyAvatar =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'

export const feedComments: FeedComment[] = [
  {
    id: 'c1',
    postId: 'impact-1',
    username: '@joshua_l',
    avatarUrl: joshuaAvatar,
    time: '2hrs ago',
    body: 'Being a part of the educational initiatives in the Dansa village has been an incredibly fulfilling experience. The joy of teaching and sharing.',
    likes: 40200,
    liked: true,
    replyCount: 600,
    replies: [
      {
        id: 'c1-r1',
        username: '@joshua_l',
        avatarUrl: joshuaAvatar,
        time: '2hrs ago',
        body: 'Being a part of the educational initiatives in the Dansa village has been an incredibly fulfilling experience. The joy of teaching and sharing.',
        likes: 40200,
        liked: true,
        replyCount: 600
      },
      {
        id: 'c1-r2',
        username: '@emily_s',
        avatarUrl: emilyAvatar,
        time: '1hr ago',
        body: 'This is the part I keep coming back to. The classroom photos say it better than I can.',
        likes: 860,
        liked: false
      }
    ]
  },
  {
    id: 'c3',
    postId: 'impact-1',
    username: '@emily_s',
    avatarUrl: emilyAvatar,
    time: '1hr ago',
    body: "Just returned from a community clean-up event in the heart of the city. It's amazing to see everyone come together for a common cause.",
    likes: 1280,
    liked: false,
    replies: [
      {
        id: 'c3-r1',
        username: '@joshua_l',
        avatarUrl: joshuaAvatar,
        time: '48mins ago',
        body: 'Save me a spot next time. Dansal could use a morning like that.',
        likes: 120,
        liked: false
      }
    ]
  },
  {
    id: 'c4',
    postId: 'impact-2',
    username: '@emily_s',
    avatarUrl: emilyAvatar,
    time: '3hrs ago',
    body: 'The produce drive photos are wonderful. Families in Dansal will feel this.',
    likes: 860,
    liked: false,
    replies: [
      {
        id: 'c4-r1',
        username: '@joshua_l',
        avatarUrl: joshuaAvatar,
        time: '2hrs ago',
        body: 'The bananas went first. The sack of grain is already spoken for.',
        likes: 64,
        liked: true
      }
    ]
  },
  {
    id: 'c5',
    postId: 'gathr-1',
    username: '@amina_k',
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    time: '5hrs ago',
    body: '128 communities is a milestone worth celebrating. Onward.',
    likes: 420,
    liked: false,
    replies: []
  },
  {
    id: 'c6',
    postId: 'gathr-2',
    username: '@green_earth',
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
    time: '1 day ago',
    body: 'Clean water for three schools changes the whole term. Count us in.',
    likes: 210,
    liked: false,
    replies: [
      {
        id: 'c6-r1',
        username: '@amina_k',
        avatarUrl:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
        time: '20hrs ago',
        body: 'We can host the well briefing next week.',
        likes: 18,
        liked: false
      }
    ]
  },
  {
    id: 'c7',
    postId: 'community-1',
    username: '@joshua_l',
    avatarUrl: joshuaAvatar,
    time: '6hrs ago',
    body: 'A garden on day one. This community is going to feed itself.',
    likes: 96,
    liked: false,
    replies: []
  },
  {
    id: 'c8',
    postId: 'event-1',
    username: '@emily_s',
    avatarUrl: emilyAvatar,
    time: '4hrs ago',
    body: 'Sharing this with my neighbors. See you at 7.',
    likes: 54,
    liked: false,
    replies: []
  }
]

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
