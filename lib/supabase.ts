import { Platform } from 'react-native'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const storage = Platform.OS === 'web'
  ? {
      async getItem(key: string) {
        return localStorage.getItem(key)
      },
      async setItem(key: string, value: string) {
        localStorage.setItem(key, value)
      },
      async removeItem(key: string) {
        localStorage.removeItem(key)
      },
    }
  : {
      async getItem(key: string) {
        return SecureStore.getItemAsync(key)
      },
      async setItem(key: string, value: string) {
        await SecureStore.setItemAsync(key, value)
      },
      async removeItem(key: string) {
        await SecureStore.deleteItemAsync(key)
      },
    }

export const supabase = createClient(
  (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim(),
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim(),
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
)