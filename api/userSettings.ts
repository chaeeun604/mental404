import { supabase } from '../lib/supabase'
import { UserSettingsRow } from '../types/database'

export async function getUserSettings(userId: string): Promise<UserSettingsRow | null> {
  const { data, error } = await supabase
    .from('user_settings').select('*').eq('user_id', userId).single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function upsertUserSettings(
  userId: string,
  settings: Partial<Pick<UserSettingsRow, 'notification_enabled' | 'notification_time' | 'auto_adjust'>>
): Promise<UserSettingsRow> {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select().single()
  if (error) throw error
  return data
}