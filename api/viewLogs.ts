import { supabase } from '../lib/supabase'

export async function logView(userId: string, contentId: string, tagId?: string): Promise<void> {
  const { error } = await supabase
    .from('view_logs')
    .insert({ user_id: userId, content_id: contentId, tag_id: tagId ?? null })
  if (error) throw error
}

export async function getViewStats(userId: string, days: number = 14) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('view_logs')
    .select('viewed_at, tag_id, tags(name, emoji)')
    .eq('user_id', userId)
    .gte('viewed_at', since.toISOString())
    .order('viewed_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getMostViewedTags(userId: string, days: number = 14) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('view_logs')
    .select('tag_id, tags(name, emoji)')
    .eq('user_id', userId)
    .gte('viewed_at', since.toISOString())
    .not('tag_id', 'is', null)
  if (error) throw error

  const count: Record<string, { name: string; emoji: string; count: number }> = {}

  for (const row of data) {
    const tagId = row.tag_id as string | null
    const tag = row.tags as any
    if (!tagId || !tag) continue
    if (!count[tagId]) count[tagId] = { name: tag.name, emoji: tag.emoji, count: 0 }
    count[tagId].count++
  }

  return Object.entries(count)
    .map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => b.count - a.count)
}

export async function getPeakHour(userId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('view_logs')
    .select('viewed_at')
    .eq('user_id', userId)
  if (error) throw error
  if (!data || data.length < 7) return null

  const hourCount: Record<number, number> = {}
  for (const row of data) {
    const hour = new Date(row.viewed_at as string).getHours()
    hourCount[hour] = (hourCount[hour] ?? 0) + 1
  }

  const peak = Object.entries(hourCount).sort((a, b) => Number(b[1]) - Number(a[1]))[0]
  return peak ? parseInt(peak[0]) : null
}