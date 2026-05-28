import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../hooks/useAuth'
import PixelLogo from '../components/PixelLogo'
import ConstellationGraphic from '../components/ConstellationGraphic'
import type { ScreenProps } from '../types/navigation'

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
  if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
    return '이메일 인증이 필요해요. 가입 시 받은 인증 메일을 확인해주세요.\n\n(개발 환경에서는 Supabase 대시보드 → Authentication → Providers → Email → "Confirm email" 비활성화)'
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return '이메일 또는 비밀번호가 올바르지 않아요.'
  }
  if (msg.includes('user already registered')) {
    return '이미 가입된 이메일이에요. 로그인해주세요.'
  }
  if (msg.includes('password')) {
    return '비밀번호는 6자 이상이어야 해요.'
  }
  return e?.message ?? '오류가 발생했어요. 다시 시도해주세요.'
}

export default function AuthScreen({ navigation }: ScreenProps<'Auth'>) {
  const { signIn, signUp } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async () => {
    const emailTrimmed = email.trim()
    if (!emailTrimmed || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 모두 입력해주세요.')
      return
    }
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailReg.test(emailTrimmed)) {
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
        navigation.replace('Onboarding')
      } else {
        await signIn(emailTrimmed, password)
        navigation.replace('Home')
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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 태그라인 */}
          <Text style={styles.tagline}>오늘의 별이 내일의 위로가 되도록</Text>

          {/* 픽셀 로고 */}
          <View style={styles.logoWrap}>
            <PixelLogo dotSize={5.538} gap={1.107} letterSpacing={4} />
          </View>

          {/* 별자리 그래픽 */}
          <View style={styles.constellationWrap}>
            <ConstellationGraphic />
          </View>

          {/* 이메일/비밀번호 폼 */}
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

            <TouchableOpacity
              onPress={() => setIsSignUp(v => !v)}
              style={styles.toggleWrap}
            >
              <Text style={styles.toggleText}>
                {isSignUp ? '이미 계정이 있어요' : '계정이 없으신가요?  시작하기'}
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 68,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  tagline: {
    fontSize: 16,
    color: '#acb5ff',
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  logoWrap:          { marginBottom: 32 },
  constellationWrap: { marginBottom: 40 },
  form: { width: 350, gap: 12 },
  input: {
    backgroundColor: 'rgba(39,41,54,0.9)',
    borderRadius: 12,
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
    borderRadius: 12,
    height: 53,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  disabled:    { opacity: 0.6 },
  submitText:  { color: '#fbfcfe', fontSize: 16, fontFamily: 'Pretendard-SemiBold' },
  toggleWrap:  { alignItems: 'center', paddingVertical: 14 },
  toggleText:  { fontSize: 13, color: '#acb5ff', fontFamily: 'Pretendard-Medium' },
})
