import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Animated, Easing,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../hooks/useAuth'
import { getAllContents } from '../api/contents'
import { supabase } from '../lib/supabase'
import PixelLogo from '../components/PixelLogo'
import ConstellationGraphic from '../components/ConstellationGraphic'
import type { ScreenProps } from '../types/navigation'

// 첫 번째 마운트 여부 (스플래시에서 넘어올 때만 입장 애니메이션)
let _firstAuthMount = true

const STARS = [
  { top: '6%',  left: '10%', size: 2   },
  { top: '4%',  left: '78%', size: 1.5 },
  { top: '18%', left: '52%', size: 2.5 },
  { top: '22%', left: '28%', size: 1   },
  { top: '10%', left: '90%', size: 2   },
  { top: '74%', left: '6%',  size: 2   },
  { top: '82%', left: '88%', size: 1.5 },
  { top: '70%', left: '62%', size: 1   },
]

function getErrorMessage(e: any): string {
  const msg = (e?.message ?? '').toLowerCase()
  if (msg.includes('email not confirmed') || msg.includes('not confirmed'))
    return '이메일 인증이 필요해요. 가입 시 받은 인증 메일을 확인해주세요.'
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials'))
    return '이메일 또는 비밀번호가 올바르지 않아요.'
  if (msg.includes('user already registered'))
    return '이미 가입된 이메일이에요. 로그인해주세요.'
  if (msg.includes('password'))
    return '비밀번호는 6자 이상이어야 해요.'
  return e?.message ?? '오류가 발생했어요. 다시 시도해주세요.'
}

export default function AuthScreen({ navigation }: ScreenProps<'Auth'>) {
  const { signIn, signUp, signInWithKakao } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [kakaoLoading, setKakaoLoading] = useState(false)

  // 입장 애니메이션 — 스플래시에서 MORBIT이 올라와서 자리에 안착
  const isEntrance = useRef(_firstAuthMount)
  const logoY      = useRef(new Animated.Value(_firstAuthMount ? 260 : 0)).current
  const restOpacity = useRef(new Animated.Value(_firstAuthMount ? 0 : 1)).current

  useEffect(() => {
    if (!isEntrance.current) return
    _firstAuthMount = false

    // MORBIT이 위로 올라가 자리에 안착 (260 → 0)
    Animated.timing(logoY, {
      toValue: 0,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()

    // 나머지 요소는 MORBIT 안착 후 페이드인
    Animated.timing(restOpacity, {
      toValue: 1,
      duration: 380,
      delay: 340,
      useNativeDriver: true,
    }).start()
  }, [])

  const handleKakao = async () => {
    setKakaoLoading(true)
    try {
      await signInWithKakao()
      // Web은 signInWithKakao에서 페이지 리다이렉트되므로 이후 코드가 실행되지 않음
      if (Platform.OS === 'web') return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Kakao OAuth에서 오는 메타데이터 확인 (어떤 필드가 오는지 로그로 확인)
      console.log('Kakao user_metadata:', JSON.stringify(user.user_metadata, null, 2))

      // Kakao는 nickname, name, full_name 중 하나로 이름을 보냄
      const kakaoNickname =
        user.user_metadata?.nickname ??
        user.user_metadata?.name ??
        user.user_metadata?.full_name ??
        null

      // full_name이 비어있으면 Kakao 닉네임으로 채워줌
      if (kakaoNickname && !user.user_metadata?.full_name) {
        await supabase.auth.updateUser({
          data: { full_name: kakaoNickname },
        })
      }

      const { getAllContents } = await import('../api/contents')
      const contents = await getAllContents(user.id)
      navigation.replace(contents.length === 0 ? 'Onboarding' : 'Home')
    } catch (e: any) {
      Alert.alert('카카오 로그인 오류', e?.message ?? '다시 시도해주세요.')
    } finally {
      setKakaoLoading(false)
    }
  }

  const handleSubmit = async () => {
    const emailTrimmed = email.trim()
    if (!emailTrimmed || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 모두 입력해주세요.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      Alert.alert('입력 오류', '올바른 이메일 형식을 입력해주세요.')
      return
    }
    if (password.length < 6) {
      Alert.alert('입력 오류', '비밀번호는 6자 이상이어야 해요.')
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        await signUp(emailTrimmed, password)
        setPassword('')
        setIsSignUp(false)
        Alert.alert('가입 완료 ✦', '환영해요! 이제 로그인해주세요.')
      } else {
        const user = await signIn(emailTrimmed, password)
        const contents = await getAllContents(user.id)
        navigation.replace(contents.length === 0 ? 'Onboarding' : 'Home')
      }
    } catch (e: any) {
      Alert.alert('오류', getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#050928', '#080711']} style={styles.gradient}>
      {STARS.map((s, i) => (
        <View key={i} style={[styles.star, {
          top: s.top as any, left: s.left as any,
          width: s.size, height: s.size, borderRadius: s.size / 2,
        }]} />
      ))}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 태그라인 — 나머지 요소와 함께 페이드인 */}
          <Animated.View style={{ opacity: restOpacity }}>
            <Text style={styles.tagline}>오늘의 별이 내일의 위로가 되도록</Text>
          </Animated.View>

          {/* MORBIT 픽셀 로고 — 스플래시에서 올라와 착지 */}
          <Animated.View style={[styles.logoWrap, { transform: [{ translateY: logoY }] }]}>
            <PixelLogo dotSize={5.538} gap={1.107} letterSpacing={4} />
          </Animated.View>

          {/* 별자리 그래픽 + 폼 — 함께 페이드인 */}
          <Animated.View style={[styles.bottomContent, { opacity: restOpacity }]}>
            <View style={styles.constellationWrap}>
              <ConstellationGraphic />
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="이메일"
                placeholderTextColor="#636887"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
              <TextInput
                style={styles.input}
                placeholder="비밀번호 (6자 이상)"
                placeholderTextColor="#636887"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.disabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fbfcfe" />
                  : <Text style={styles.submitText}>{isSignUp ? '시작하기' : '로그인'}</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsSignUp(v => !v)} style={styles.toggleWrap}>
                <Text style={styles.toggleText}>
                  {isSignUp ? '이미 계정이 있어요' : '계정이 없으신가요?  시작하기'}
                </Text>
              </TouchableOpacity>

              {/* 구분선 */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>또는</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* 카카오 로그인 */}
              <TouchableOpacity
                style={[styles.kakaoBtn, kakaoLoading && styles.disabled]}
                onPress={handleKakao}
                disabled={kakaoLoading}
                activeOpacity={0.85}
              >
                {kakaoLoading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <>
                    <Text style={styles.kakaoIcon}>💬</Text>
                    <Text style={styles.kakaoText}>카카오로 시작하기</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex:     { flex: 1 },
  star:     { position: 'absolute', backgroundColor: '#fbfcfe', opacity: 0.5 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  tagline: {
    fontSize: 15,
    color: '#acb5ff',
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  logoWrap:     { marginBottom: 20 },
  bottomContent: { alignItems: 'center', width: '100%' },
  constellationWrap: { marginBottom: 28 },
  form: { width: '100%', maxWidth: 350, gap: 12 },
  input: {
    backgroundColor: 'rgba(39,41,54,0.9)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#fbfcfe',
    borderWidth: 1,
    borderColor: '#2D3052',
    fontFamily: 'Pretendard-Regular',
  },
  submitBtn: {
    backgroundColor: '#534dfc',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  disabled:    { opacity: 0.6 },
  submitText:  { color: '#fbfcfe', fontSize: 16, fontFamily: 'Pretendard-SemiBold' },
  toggleWrap:  { alignItems: 'center', paddingVertical: 14 },
  toggleText:  { fontSize: 13, color: '#acb5ff', fontFamily: 'Pretendard-Medium' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2D3052',
  },
  dividerText: {
    fontSize: 12,
    color: '#636887',
    fontFamily: 'Pretendard-Regular',
  },
  kakaoBtn: {
    backgroundColor: '#FEE500',
    borderRadius: 14,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  kakaoIcon: { fontSize: 20 },
  kakaoText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Pretendard-SemiBold',
  },
})
