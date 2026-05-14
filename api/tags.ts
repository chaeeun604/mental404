import { supabase } from '../lib/supabase'
import { TagRow } from '../types/database'

export async function getAllTags(userId: string): Promise<TagRow[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('is_default', { ascending: false })
  if (error) throw error
  return data
}

export async function createCustomTag(
    userId: string, 
    name: string, 
    emoji: string
): Promise<TagRow> {
  const { data, error } = await supabase
    .from('tags')
    .insert({ name, emoji, is_default: false, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCustomTag(tagId: string): Promise<void> {
  const { error } = await supabase.from('tags').delete().eq('id', tagId)
  if (error) throw error
}