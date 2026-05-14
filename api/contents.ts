import { supabase } from '../lib/supabase'
import { ContentRow, ContentWithTags } from '../types/database'

export async function createContent(
  userId: string, 
  payload: { type: 'text' | 'image'; body?: string; image_url?: string; memo?: string; source?: string },
  tagIds: string[]
): Promise<ContentRow> {
  const { data: content, error } = await supabase
    .from('contents').insert({ ...payload, user_id: userId }).select().single()
  if (error) throw error

  if (tagIds.length > 0) {
    const { error: tagError } = await supabase
      .from('content_tags')
      .insert(tagIds.map((tag_id) => ({ content_id: content.id, tag_id })))
    if (tagError) throw tagError
  }
  return content
}

export async function getAllContents(): Promise<ContentWithTags[]> {
  const { data, error } = await supabase
    .from('contents')
    .select('*, content_tags(tag_id, tags(*))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getContentsByTag(tagId: string): Promise<ContentWithTags[]> {
  const { data, error } = await supabase
    .from('contents')
    .select('*, content_tags!inner(tag_id, tags(*))')
    .eq('content_tags.tag_id', tagId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateContent(
  contentId: string,
  updates: Partial<Pick<ContentRow, 'body' | 'image_url' | 'memo' | 'source'>>
): Promise<void> {
  const { error } = await supabase.from('contents').update(updates).eq('id', contentId)
  if (error) throw error
}

export async function updateContentTags(contentId: string, tagIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from('content_tags').delete().eq('content_id', contentId)
  if (deleteError) throw deleteError

  if (tagIds.length > 0) {
    const { error: insertError } = await supabase
      .from('content_tags')
      .insert(tagIds.map((tag_id) => ({ content_id: contentId, tag_id })))
    if (insertError) throw insertError
  }
}

export async function deleteContent(contentId: string): Promise<void> {
  const { error } = await supabase.from('contents').delete().eq('id', contentId)
  if (error) throw error
}

export async function getDailyRecommendation(): Promise<ContentWithTags | null> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('contents')
    .select('*, content_tags(tag_id, tags(*))')
    .or(`shown_at.is.null,shown_at.lt.${todayStart.toISOString()}`)
    .limit(50)
  if (error) throw error
  if (!data || data.length === 0) return null

  const picked = data[Math.floor(Math.random() * data.length)]
  await supabase.from('contents').update({ shown_at: new Date().toISOString() }).eq('id', picked.id)
  return picked
}