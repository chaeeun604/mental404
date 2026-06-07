import { Platform } from 'react-native'
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

export async function getAllContents(userId: string): Promise<ContentWithTags[]> {
  const { data, error } = await supabase
    .from('contents')
    .select('*, content_tags(tag_id, tags(*))')
    .eq('user_id', userId)
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

export async function getContentById(contentId: string): Promise<ContentWithTags | null> {
  const { data, error } = await supabase
    .from('contents')
    .select('*, content_tags(tag_id, tags(*))')
    .eq('id', contentId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

// export async function getDailyRecommendation(): Promise<ContentWithTags | null> {
//   const todayStart = new Date()
//   todayStart.setHours(0, 0, 0, 0)

//   const { data, error } = await supabase
//     .from('contents')
//     .select('*, content_tags(tag_id, tags(*))')
//     .or(`shown_at.is.null,shown_at.lt.${todayStart.toISOString()}`)
//     .limit(50)
//   if (error) throw error
//   if (!data || data.length === 0) return null

//   const picked = data[Math.floor(Math.random() * data.length)]
//   await supabase.from('contents').update({ shown_at: new Date().toISOString() }).eq('id', picked.id)
//   return picked
// }

// base64 문자열 → ArrayBuffer (Supabase 공식 RN 권장 방식, new Blob([ArrayBuffer]) 에러 회피)
function decodeBase64(base64: string): ArrayBuffer {
  const binaryStr = atob(base64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return bytes.buffer
}

export async function uploadImage(user_id: string, uri: string, base64Data?: string): Promise<string> {
  const basePath = `${user_id}/${Date.now()}`
  let ext: string
  let mimeType: string
  let uploadBody: Blob | ArrayBuffer

  if (Platform.OS === 'web' || uri.startsWith('blob:')) {
    // Web: blob: URI → fetch → Blob
    const response = await fetch(uri)
    const blob = await response.blob()
    ext = (blob.type.split('/')[1] ?? 'jpg').split('+')[0]
    mimeType = blob.type || 'image/jpeg'
    uploadBody = blob
  } else {
    // Native (Android/iOS): ArrayBuffer를 직접 Supabase에 전달
    // React Native에서 new Blob([ArrayBuffer])는 미지원이므로 Blob 생성 안 함
    ext = (uri.split('.').pop() ?? 'jpg').toLowerCase().split('?')[0]
    if (ext === 'jpeg') ext = 'jpg'
    mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`

    if (base64Data) {
      uploadBody = decodeBase64(base64Data)
    } else {
      // base64 없으면 file:// URI fetch (fallback)
      const response = await fetch(uri)
      uploadBody = await response.arrayBuffer()
    }
  }

  const path = `${basePath}.${ext}`
  console.log('[uploadImage] path:', path, 'type:', mimeType,
    'size:', uploadBody instanceof ArrayBuffer ? uploadBody.byteLength : (uploadBody as Blob).size)

  const { error } = await supabase.storage
    .from('contents')
    .upload(path, uploadBody, { contentType: mimeType })

  if (error) {
    console.error('[uploadImage] error:', error.message)
    throw error
  }

  const { data } = supabase.storage.from('contents').getPublicUrl(path)
  console.log('[uploadImage] URL:', data.publicUrl)
  return data.publicUrl
}

// 가중치 기반 추천
// 규칙: 덜 열어본 것 우선 + 오래된 것 우선 + 모든 콘텐츠 추천 가능 (확률 차이만 있음)
function calcWeight(viewCount: number, createdAt: string): number {
  const daysOld = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 86400000)

  // 열람 횟수 기반 기본 가중치 (덜 본 것이 높음)
  const viewWeight = Math.max(1, 10 - viewCount * 2.5)

  // 오래된 콘텐츠 보너스 (7일 당 +1, 최대 +4)
  const ageBonus = Math.min(4, daysOld / 7)

  // 최근 저장 페널티 (2일 이내 50% 감소)
  const recencyPenalty = daysOld < 2 ? 0.5 : 1.0

  return (viewWeight + ageBonus) * recencyPenalty
}

function weightedRandom<T>(items: { item: T; weight: number }[]): T | null {
  const total = items.reduce((sum, i) => sum + i.weight, 0)
  if (total === 0) return null
  let rand = Math.random() * total
  for (const { item, weight } of items) {
    rand -= weight
    if (rand <= 0) return item
  }
  return items[items.length - 1].item
}

export async function getDailyRecommendation(userId: string): Promise<ContentWithTags | null> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // 전체 콘텐츠 가져오기 (오늘 이미 추천된 것 제외 - 폴백 있음)
  let { data, error } = await supabase
    .from('contents')
    .select('*, content_tags(tag_id, tags(*))')
    .eq('user_id', userId)
    .or(`shown_at.is.null,shown_at.lt.${todayStart.toISOString()}`)
  if (error) throw error

  // 오늘 추천 소진 시 전체 풀에서 재추천
  if (!data || data.length === 0) {
    const { data: all, error: e2 } = await supabase
      .from('contents')
      .select('*, content_tags(tag_id, tags(*))')
      .eq('user_id', userId)
    if (e2) throw e2
    if (!all || all.length === 0) return null
    data = all
  }

  // 열람 횟수 조회
  const ids = data.map(c => c.id)
  const { data: viewData } = await supabase
    .from('view_logs')
    .select('content_id')
    .in('content_id', ids)
    .eq('user_id', userId)

  const viewCountMap: Record<string, number> = {}
  for (const log of viewData ?? []) {
    const id = log.content_id as string
    viewCountMap[id] = (viewCountMap[id] ?? 0) + 1
  }

  // 가중치 계산
  const weighted = data.map(content => ({
    item: content,
    weight: calcWeight(viewCountMap[content.id] ?? 0, content.created_at),
  }))

  const picked = weightedRandom(weighted)
  if (!picked) return null

  await supabase
    .from('contents')
    .update({ shown_at: new Date().toISOString() })
    .eq('id', picked.id)

  return picked
}

// 특정 기간 내 view_logs 열람 횟수 (리포트 "스스로 위로한 횟수")
export async function getViewCountForPeriod(
  userId: string,
  start: Date,
  end: Date
): Promise<number> {
  const { data, error } = await supabase
    .from('view_logs')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('viewed_at', start.toISOString())
    .lte('viewed_at', end.toISOString())
  if (error) throw error
  return (data as any)?.length ?? 0
}