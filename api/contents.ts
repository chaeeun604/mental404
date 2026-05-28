import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { ContentRow, ContentWithTags } from '../types/database'
import * as FileSystem from 'expo-file-system'

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
    //.eq('user_id', userId) 클로드가 추가하라 했는데 일단 주석으로
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

export async function uploadImage(user_id: string, uri: string): Promise<string> {
  const basePath = `${user_id}/${Date.now()}`

  if (Platform.OS === 'web') {
    const response = await fetch(uri)
    const blob = await response.blob()
    const ext = blob.type.split('/')[1] ?? 'jpg'
    const path = `${basePath}.${ext}`
    const { error } = await supabase.storage
      .from('contents')
      .upload(path, blob, { contentType: blob.type })
    if (error) throw error
    return supabase.storage.from('contents').getPublicUrl(path).data.publicUrl
  }

  const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase().split('?')[0]
  const mimeType = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : `image/${ext}`
  const path = `${basePath}.${ext}`

  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any })
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  const { error } = await supabase.storage
    .from('contents')
    .upload(path, bytes.buffer, { contentType: mimeType })
  if (error) throw error
  return supabase.storage.from('contents').getPublicUrl(path).data.publicUrl
}

// 가중치 기반 추천 방식 관련 함수. 사용자 맞춤 추천 기능 (자주 안열어 본 것 우선으로 추천.)
//getDailyRecommendation 를 고도화 시키는 방식으로 변경. 
function getViewCountWeight(viewCount: number): number {
  if (viewCount === 0) return 5
  if (viewCount === 1) return 3
  if (viewCount === 2) return 2
  return 1  // 3회 이상
} //가중치 알고리즘 추가 함수

function weightedRandom<T>(items: { item: T; weight: number }[]): T | null {
  const total = items.reduce((sum, i) => sum + i.weight, 0)
  if (total === 0) return null
 
  let rand = Math.random() * total
  for (const { item, weight } of items) {
    rand -= weight
    if (rand <= 0) return item
  }
  return items[items.length - 1].item
} //가중치 알고리즘 추가 함수

export async function getDailyRecommendation(userId: string): Promise<ContentWithTags | null> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
 
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
 
  // 오늘 아직 추천 안 된 콘텐츠 전체 가져오기
  let { data, error } = await supabase
    .from('contents')
    .select('*, content_tags(tag_id, tags(*))')
    .eq('user_id', userId)
    .or(`shown_at.is.null,shown_at.lt.${todayStart.toISOString()}`)
  if (error) throw error
 
  // 폴백: 모든 콘텐츠가 오늘 이미 추천된 경우 전체 대상으로
  if (!data || data.length === 0) {
    const { data: fallback, error: fallbackError } = await supabase
      .from('contents')
      .select('*, content_tags(tag_id, tags(*))')
      .eq('user_id', userId)
    if (fallbackError) throw fallbackError
    if (!fallback || fallback.length === 0) return null
    data = fallback
  }
 
  // 각 콘텐츠의 열람 횟수 조회
  const contentIds = data.map((c) => c.id)
  const { data: viewData, error: viewError } = await supabase
    .from('view_logs')
    .select('content_id')
    .in('content_id', contentIds)
    .eq('user_id', userId)
  if (viewError) throw viewError
 
  // content_id별 열람 횟수 집계
  const viewCountMap: Record<string, number> = {}
  for (const log of viewData ?? []) {
    const id = log.content_id as string
    viewCountMap[id] = (viewCountMap[id] ?? 0) + 1
  }
 
  // 각 콘텐츠에 가중치 계산
  const weighted = data.map((content) => {
    const viewCount = viewCountMap[content.id] ?? 0
    let weight = getViewCountWeight(viewCount)
 
    // 2일 이내 저장한 콘텐츠는 가중치 절반
    const isRecentlyCreated = new Date(content.created_at) > twoDaysAgo
    if (isRecentlyCreated) weight *= 0.5
 
    return { item: content, weight }
  })
 
  const picked = weightedRandom(weighted)
  if (!picked) return null
 
  // 추천된 콘텐츠의 shown_at 업데이트
  await supabase
    .from('contents')
    .update({ shown_at: new Date().toISOString() })
    .eq('id', picked.id)
 
  return picked
}