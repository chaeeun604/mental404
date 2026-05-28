import { useState } from 'react'
import { ContentWithTags } from '../types/database'
import { getContentsByTag, getDailyRecommendation } from '../api/contents'

export function useContents(userId: string) {
  const [contents, setContents] = useState<ContentWithTags[]>([])
  const [recommendation, setRecommendation] = useState<ContentWithTags | null>(null)
  const [loading, setLoading] = useState(false)

  const loadByTag = async (tagId: string) => {
    setLoading(true)
    const data = await getContentsByTag(tagId)
    setContents(data)
    setLoading(false)
  }

  const loadRecommendation = async () => {
    setLoading(true)
    const data = await getDailyRecommendation(userId)
    setRecommendation(data)
    setLoading(false)
  }

  return { contents, recommendation, loading, loadByTag, loadRecommendation }
}