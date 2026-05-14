export type TagRow = {
  id: string
  name: string
  emoji: string
  is_default: boolean
  user_id: string | null
}

export type ContentRow = {
  id: string
  user_id: string
  type: 'text' | 'image'
  body: string | null
  image_url: string | null
  memo: string | null
  source: string | null
  shown_at: string | null
  created_at: string
}

export type ContentTagRow = {
  id: string
  content_id: string
  tag_id: string
}

export type ViewLogRow = {
  id: string
  user_id: string
  content_id: string
  tag_id: string | null
  viewed_at: string
}

export type UserSettingsRow = {
  id: string
  user_id: string
  notification_enabled: boolean
  notification_time: string // "HH:MM:SS"
  auto_adjust: boolean
  updated_at: string
}

export type ContentWithTags = ContentRow & {
  content_tags: { tag_id: string; tags: TagRow }[]
}