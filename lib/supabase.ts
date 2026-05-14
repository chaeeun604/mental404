import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: {
        async getItem(key: string) {
          return SecureStore.getItemAsync(key)
        },
        async setItem(key: string, value: string) {
          await SecureStore.setItemAsync(key, value)
        },
        async removeItem(key: string) {
          await SecureStore.deleteItemAsync(key)
        },
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)