import { useState, useEffect } from 'react'
import { Platform } from 'react-native'
import { Session, AuthChangeEvent } from '@supabase/supabase-js'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.user
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const signInWithKakao = async () => {
    if (Platform.OS === 'web') {
      // Web: 페이지 전체를 카카오 로그인으로 리다이렉트
      // 로그인 완료 후 Supabase가 URL의 토큰을 자동으로 감지(detectSessionInUrl: true)
      await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: window.location.origin,
        },
      })
      return
    }

    // Native: 인앱 브라우저로 카카오 로그인 후 딥링크로 토큰 수신
    const redirectTo = Linking.createURL('auth-callback')

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    })
    if (error || !data.url) throw error ?? new Error('OAuth URL 생성 실패')

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
    if (result.type !== 'success') return

    // Supabase는 토큰을 hash fragment 또는 query string으로 전달
    const raw = result.url
    const fragment = raw.includes('#') ? raw.split('#')[1] : raw.split('?')[1]
    const params = new URLSearchParams(fragment ?? '')
    const accessToken  = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) throw new Error('토큰을 받아오지 못했어요.')

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (sessionError) throw sessionError
  }

  return { session, loading, signUp, signIn, signOut, signInWithKakao }
}
