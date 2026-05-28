import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../hooks/useAuth'
import PixelLogo from '../components/PixelLogo'
import type { ScreenProps } from '../types/navigation'

// Figma asset: constellation graphic (star lines + glow)
// Replace with local asset once downloaded
const CONSTELLATION_IMG = 'https://www.figma.com/api/mcp/asset/06b46485-0bda-412c-8e85-bec31db5ef6d'
const KAKAO_ICON = 'https://www.figma.com/api/mcp/asset/73f5d151-b39a-4747-a77c-938416e765bb'

// Background star dots (decorative)
const STARS = [
  { top: '8%', left: '12%', size: 2 },
  { top: '5%', left: '75%', size: 1.5 },
  { top: '22%', left: '30%', size: 1 },
  { top: '12%', left: '88%', size: 2 },
  { top: '72%', left: '5%', size: 2 },
  { top: '80%', left: '85%', size: 1.5 },
  { top: '68%', left: '60%', size: 2.5 },
]

export default function AuthScreen({ navigation }: ScreenProps<'Auth'>) {
  const { signIn, signUp, signInWithKakao } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleKakao = async () => {
    setLoading(true)
    try {
      await signInWithKakao()
      navigation.replace('Home')
    } catch (e: any) {
      Alert.alert('로그인 오류', e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('이메일과 비밀번호를 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      if (isSignUp) {
        await signUp(email.trim(), password)
        navigation.replace('Onboarding')
      } else {
        await signIn(email.trim(), password)
        navigation.replace('Home')
      }
    } catch (e: any) {
      Alert.alert('오류', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#050928', '#080711']} style={styles.gradient}>
      {/* Star dots */}
      {STARS.map((star, i) => (
        <View
          key={i}
          style={[
            styles.star,
            {
              top: star.top as any,
              left: star.left as any,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
            },
          ]}
        />
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
          {/* Tagline */}
          <Text style={styles.tagline}>오늘의 별이 내일의 위로가 되도록</Text>

          {/* Pixel logo */}
          <View style={styles.logoWrap}>
            <PixelLogo dotSize={5.538} gap={1.107} letterSpacing={4} />
          </View>

          {/* Constellation graphic */}
          <View style={styles.constellationWrap}>
            <Image
              source={{ uri: CONSTELLATION_IMG }}
              style={styles.constellation}
              resizeMode="contain"
            />
          </View>

          {/* Kakao login button */}
          <TouchableOpacity
            style={[styles.kakaoBtn, loading && styles.btnDisabled]}
            onPress={handleKakao}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Image source={{ uri: KAKAO_ICON }} style={styles.kakaoIcon} resizeMode="contain" />
            <Text style={styles.kakaoText}>
              {loading ? '로그인 중...' : '카카오 로그인'}
            </Text>
          </TouchableOpacity>

          {/* Legal text */}
          <Text style={styles.legal}>
            로그인 시,{' '}
            <Text style={styles.legalUnderline}>서비스 이용약관</Text>
            에 동의하는 것으로 간주합니다.
          </Text>

          {/* Email login toggle (dev/fallback) */}
          {!showEmail ? (
            <TouchableOpacity onPress={() => setShowEmail(true)} style={styles.emailToggle}>
              <Text style={styles.emailToggleText}>이메일로 로그인</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.emailForm}>
              <TextInput
                style={styles.input}
                placeholder="이메일"
                placeholderTextColor="#636887"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
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
                style={[styles.emailSubmitBtn, loading && styles.btnDisabled]}
                onPress={handleEmailSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fbfcfe" />
                  : <Text style={styles.emailSubmitText}>{isSignUp ? '회원가입' : '로그인'}</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsSignUp(v => !v)} style={styles.emailToggle}>
                <Text style={styles.emailToggleText}>
                  {isSignUp ? '이미 계정이 있어요' : '계정 만들기'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  star: {
    position: 'absolute',
    backgroundColor: '#fbfcfe',
    opacity: 0.5,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  tagline: {
    fontSize: 16,
    color: '#acb5ff',
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    marginBottom: 20,
  },
  logoWrap: {
    marginBottom: 32,
  },
  constellationWrap: {
    width: 248,
    height: 186,
    marginBottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  constellation: {
    width: '100%',
    height: '100%',
  },
  kakaoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#fee500',
    width: 350,
    height: 53,
    borderRadius: 12,
    marginBottom: 12,
  },
  btnDisabled: { opacity: 0.6 },
  kakaoIcon: {
    width: 24,
    height: 24,
  },
  kakaoText: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: 'rgba(26,28,32,0.85)',
  },
  legal: {
    fontSize: 12,
    color: '#9a9fb3',
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  legalUnderline: {
    textDecorationLine: 'underline',
  },
  emailToggle: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emailToggleText: {
    fontSize: 13,
    color: '#acb5ff',
    fontFamily: 'Pretendard-Medium',
  },
  emailForm: {
    width: 350,
    gap: 10,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#272936',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#fbfcfe',
    borderWidth: 1,
    borderColor: '#2D3052',
    fontFamily: 'Pretendard-Regular',
  },
  emailSubmitBtn: {
    backgroundColor: '#534dfc',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  emailSubmitText: {
    color: '#fbfcfe',
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
  },
})
