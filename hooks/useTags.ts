import { useState, useEffect } from 'react'
import { TagRow } from '../types/database'
import { getAllTags, createCustomTag, deleteCustomTag } from '../api/tags'

export function useTags(userId: string) {
  const [tags, setTags] = useState<TagRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const data = await getAllTags(userId)
    setTags(data)
    setLoading(false)
  }
 
  useEffect(() => { if (userId) load() }, [userId])

  const addCustomTag = async (name: string, emoji: string): Promise<TagRow> => {
    const newTag = await createCustomTag(userId, name, emoji)
    setTags((prev) => [...prev, newTag])
    return newTag
  }

  const removeCustomTag = async (tagId: string) => {
    await deleteCustomTag(tagId)
    setTags((prev) => prev.filter((t) => t.id !== tagId))
  }

  return { tags, loading, addCustomTag, removeCustomTag, refresh: load }
}