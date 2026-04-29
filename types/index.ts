// User types
export type User = {
  id: number
  name: string
  email: string
  role: string
  avatar: string | null
}

export type UserWithStats = User & {
  posts_count?: number
  comments_count?: number
  is_active?: boolean
  created_at: string
}

export type AuthUser = {
  id: number
  name: string
  email: string
  role: string
  avatar: string | null
}

// Category types
export type Category = {
  id: number
  name: string
  slug?: string
  posts_count?: number
  created_at?: string
}

// Content block types - for GET response
export type ContentBlock = {
  type: 'heading' | 'text' | 'media'
  order: number
  value: string | null
  media?: {
    id: number
    url: string
  } | null
}

// Content block types - for PUT request
export type ContentBlockUpdate = {
  type: 'heading' | 'text' | 'media'
  order: string
  value?: string
  media?: {
    existingMediaId?: number
    newMedia?: {
      name: string
      size: string
    }
  }
}

// Interaction counts
export type InteractionCounts = {
  like: number
  dislike: number
  wow: number
  love: number
  hate: number
}

// Post types
export type Post = {
  id: number
  title: string
  status: string
  content: ContentBlock[]
  user_id: number
  category_id: number
  user: User
  category: Category | null
  thumbnail: string | null
  interaction_counts: InteractionCounts
  my_interaction: {
    id: number
    user_id: number
    action: string
    interactable_type: string
    interactable_id: number
  } | null
  comments_count: number
  created_at: string
  updated_at: string
}

// Post update payload
export type PostUpdatePayload = {
  title: string
  categoryId: string
  status: string
  content: ContentBlockUpdate[]
}

// Comment types
export type Comment = {
  id: number
  content: string
  post_id: number
  user_id: number
  user: User
  post?: {
    id: number
    title: string
  }
  interaction_counts: InteractionCounts
  my_interaction: null
  created_at: string
  updated_at: string
}

// Pagination types
export type CursorMeta = {
  path: string
  per_page: number
  next_cursor: string | null
  prev_cursor: string | null
}

export type CursorLinks = {
  first: null
  last: null
  prev: string | null
  next: string | null
}

export type PaginatedResponse<T> = {
  data: T[]
  links: CursorLinks
  meta: CursorMeta
}

// Dashboard types
export type DashboardStats = {
  users: number
  posts: number
  comments: number
  interactions: number
}

export type GrowthPoint = {
  total: number
  date: string
}

export type EngagementPoint = {
  action: string
  date: string
  total: number
}

export type DashboardResponse = {
  stats: DashboardStats
  contents: {
    post_per_category: Category[]
    recent_posts: Post[]
    top_liked_posts: Post[]
  }
  engagements: EngagementPoint[]
  analytics: {
    user_growth: GrowthPoint[]
    post_growth: GrowthPoint[]
  }
}

// API Response types
export type LoginResponse = {
  data: {
    token: string
    user: AuthUser
  }
}

export type ApiError = {
  message: string
  errors: Record<string, string[]>
}
