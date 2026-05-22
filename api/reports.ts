import { supabase } from '../lib/supabase'
import { ContentWithTags } from '../types/database'

export type BiweeklyPeriod = {
  label: string   // "6월 1-2주차"
  start: Date
  end: Date
  isNew: boolean
}

export type PeriodStats = {
  totalSaved: number
  totalViews: number
  topTag: { name: string; emoji: string; count: number } | null
  mostViewedContent: ContentWithTags | null
  tagDistribution: { name: string; emoji: string; count: number }[]
  dayDistribution: { day: string; count: number }[]   // 월~일
  timeDistribution: { label: string; count: number }[] // 새벽~밤
  peakLabel: string | null
}

const DAY_SHORT = ['일', '월', '화', '수', '목', '금', '토']
const DAY_FULL  = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

function timeLabel(hour: number): string {
  if (hour < 6)  return '새벽'
  if (hour < 12) return '아침'
  if (hour < 18) return '오후'
  if (hour < 21) return '저녁'
  return '밤'
}

// 두 주 단위 기간 목록 생성 (완료된 기간만, 최신순)
export function generatePeriods(earliest: Date): BiweeklyPeriod[] {
  const periods: BiweeklyPeriod[] = []
  const now = new Date()
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  let y = earliest.getFullYear()
  let m = earliest.getMonth()

  while (new Date(y, m, 1) <= now) {
    const firstStart = new Date(y, m, 1)
    const firstEnd   = new Date(y, m, 14, 23, 59, 59)
    if (firstEnd < now) {
      periods.push({
        label: `${m + 1}월 1-2주차`,
        start: firstStart,
        end: firstEnd,
        isNew: firstEnd > twoWeeksAgo,
      })
    }

    const secondStart = new Date(y, m, 15)
    const secondEnd   = new Date(y, m + 1, 0, 23, 59, 59)
    if (secondEnd < now) {
      periods.push({
        label: `${m + 1}월 3-4주차`,
        start: secondStart,
        end: secondEnd,
        isNew: secondEnd > twoWeeksAgo,
      })
    }

    m++
    if (m > 11) { m = 0; y++ }
  }

  return periods.reverse()
}

export async function getEarliestDate(userId: string): Promise<Date | null> {
  const { data } = await supabase
    .from('contents')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
  return data?.[0] ? new Date(data[0].created_at) : null
}

export async function getPeriodStats(
  userId: string,
  start: Date,
  end: Date
): Promise<PeriodStats> {
  const [savedRes, viewRes] = await Promise.all([
    supabase
      .from('contents')
      .select('*, content_tags(tag_id, tags(*))')
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString()),
    supabase
      .from('view_logs')
      .select('content_id, tag_id, viewed_at, tags(name, emoji)')
      .eq('user_id', userId)
      .gte('viewed_at', start.toISOString())
      .lte('viewed_at', end.toISOString()),
  ])

  if (savedRes.error) throw savedRes.error
  if (viewRes.error) throw viewRes.error

  const saved = savedRes.data ?? []
  const views = viewRes.data ?? []

  // 태그별 열람 횟수
  const tagCount: Record<string, { name: string; emoji: string; count: number }> = {}
  for (const v of views) {
    const tag = v.tags as any
    if (!v.tag_id || !tag) continue
    const id = v.tag_id as string
    if (!tagCount[id]) tagCount[id] = { name: tag.name, emoji: tag.emoji, count: 0 }
    tagCount[id].count++
  }
  const tagDistribution = Object.values(tagCount).sort((a, b) => b.count - a.count)

  // 가장 많이 열람된 콘텐츠
  const cCount: Record<string, number> = {}
  for (const v of views) cCount[v.content_id as string] = (cCount[v.content_id as string] ?? 0) + 1
  const topCId = Object.entries(cCount).sort((a, b) => b[1] - a[1])[0]?.[0]

  let mostViewedContent: ContentWithTags | null = null
  if (topCId) {
    const { data } = await supabase
      .from('contents')
      .select('*, content_tags(tag_id, tags(*))')
      .eq('id', topCId)
      .single()
    mostViewedContent = data
  }

  // 요일 · 시간대 분포
  const dayCount: Record<number, number>  = {}
  const hourCount: Record<number, number> = {}
  for (const v of views) {
    const d = new Date(v.viewed_at as string)
    dayCount[d.getDay()]   = (dayCount[d.getDay()]   ?? 0) + 1
    hourCount[d.getHours()] = (hourCount[d.getHours()] ?? 0) + 1
  }

  const dayDistribution = [1,2,3,4,5,6,0].map(d => ({ day: DAY_SHORT[d], count: dayCount[d] ?? 0 }))

  const timeSums: Record<string, number> = { '새벽': 0, '아침': 0, '오후': 0, '저녁': 0, '밤': 0 }
  for (const [h, c] of Object.entries(hourCount)) timeSums[timeLabel(parseInt(h))] += c
  const timeDistribution = ['새벽','아침','오후','저녁','밤'].map(l => ({ label: l, count: timeSums[l] }))

  // 피크 레이블
  let peakLabel: string | null = null
  if (views.length > 0) {
    const pd = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]
    const ph = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]
    if (pd && ph) {
      const h = parseInt(ph[0])
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
      peakLabel = `${DAY_FULL[parseInt(pd[0])]} ${timeLabel(h)} ${h12}시`
    }
  }

  return {
    totalSaved: saved.length,
    totalViews: views.length,
    topTag: tagDistribution[0] ?? null,
    mostViewedContent,
    tagDistribution,
    dayDistribution,
    timeDistribution,
    peakLabel,
  }
}
