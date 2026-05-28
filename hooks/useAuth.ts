import { useState, useEffect } from 'react'
import { Platform } from 'react-native'
import { Session, AuthChangeEvent } from '@supabase/supabase-js'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from '../lib/supabase'
import { getAllContents } from '../api/contents'

WebBrowser.maybeCompleteAuthSession()

// 카카오 로그인 사전 설정 필요:
// 1. https://developers.kakao.com → 앱 생성 → REST API 키 복사
// 2. 카카오 앱 → 카카오 로그인 활성화 → Redirect URI 추가:
//    https://qsnccbmpzglbvblfkyvv.supabase.co/auth/v1/callback
//    morbit://auth/callback (네이티브용)
// 3. Supabase Dashboard → Auth → Providers → Kakao → Client ID/Secret 입력

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then((response) => {
      setSession(response.data.session)
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  // navigation을 받아서 기록 유무에 따라 라우팅
  const signInWithKakao = async (navigation: any) => {
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
      return
    }

    const redirectUri = Linking.createURL('auth/callback')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: redirectUri, skipBrowserRedirect: true },
    })
    if (error) throw error
    if (!data.url) throw new Error('OAuth URL을 가져오지 못했어요.')

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri)
    if (result.type === 'success') {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.exchangeCodeForSession(result.url)
      if (sessionError) throw sessionError

      // 기록 유무 확인 → 온보딩 or 홈
      const userId = sessionData.session?.user?.id
      if (userId) {
        const contents = await getAllContents(userId)
        navigation.replace(contents.length === 0 ? 'Onboarding' : 'Home')
      }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { session, loading, signUp, signIn, signInWithKakao, signOut }
}
