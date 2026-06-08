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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
        },
      })
      if (error || !data.url) throw error ?? new Error('OAuth URL 생성 실패')

      // Supabase가 기본으로 추가하는 account_email scope 제거 (카카오 비즈앱 미등록)
      const url = new URL(data.url)
      const scope = url.searchParams.get('scope') ?? ''
      const cleaned = scope.split(/[\s+]/).filter(s => s !== 'account_email').join('+')
      url.searchParams.set('scope', cleaned)

      window.location.href = url.toString()
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

    // 웹과 동일하게 Supabase 기본 account_email scope 제거 (카카오 비즈앱 미등록)
    const nativeUrl = new URL(data.url)
    const nativeScope = nativeUrl.searchParams.get('scope') ?? ''
    const nativeCleaned = nativeScope.split(/[\s+]/).filter(s => s !== 'account_email').join('+')
    nativeUrl.searchParams.set('scope', nativeCleaned)

    const result = await WebBrowser.openAuthSessionAsync(nativeUrl.toString(), redirectTo)
    if (result.type !== 'success') return

    const raw = result.url

    // PKCE flow: ?code=... (Supabase 기본)
    const queryString = raw.includes('?') ? raw.split('?')[1].split('#')[0] : ''
    const queryParams = new URLSearchParams(queryString)
    const code = queryParams.get('code')
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) throw exchangeError
      return
    }

    // Implicit flow: #access_token=...&refresh_token=...
    const fragment = raw.includes('#') ? raw.split('#')[1] : ''
    const hashParams = new URLSearchParams(fragment)
    const accessToken  = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (!accessToken || !refreshToken) throw new Error('토큰을 받아오지 못했어요.')

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (sessionError) throw sessionError
  }

  return { session, loading, signUp, signIn, signOut, signInWithKakao }
}
