import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../hooks/useAuth'
import PixelLogo from '../components/PixelLogo'
import type { ScreenProps } from '../types/navigation'

// Figma 별자리 그래픽 asset
const CONSTELLATION_IMG = 'https://www.figma.com/api/mcp/asset/06b46485-0bda-412c-8e85-bec31db5ef6d'

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
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
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
      {STARS.map((star, i) => (
        <View
          key={i}
          style={[
            styles.star,
            { top: star.top as any, left: star.left as any, width: star.size, height: star.size, borderRadius: star.size / 2 },
          ]}
        />
      ))}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
            <Image
              source={{ uri: CONSTELLATION_IMG }}
              style={styles.constellation}
              resizeMode="contain"
            />
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
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fbfcfe" />
                : <Text style={styles.buttonText}>{isSignUp ? '시작하기' : '로그인'}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsSignUp(v => !v)} style={styles.toggle}>
              <Text style={styles.toggleText}>
                {isSignUp ? '이미 계정이 있어요' : '계정 만들기'}
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
  flex: { flex: 1 },
  star: { position: 'absolute', backgroundColor: '#fbfcfe', opacity: 0.5 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 72,
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
  logoWrap: { marginBottom: 28 },
  constellationWrap: {
    width: 248,
    height: 186,
    marginBottom: 36,
  },
  constellation: { width: '100%', height: '100%' },
  form: { width: 350, gap: 12 },
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
  button: {
    backgroundColor: '#534dfc',
    borderRadius: 12,
    height: 53,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fbfcfe', fontSize: 16, fontFamily: 'Pretendard-SemiBold' },
  toggle: { alignItems: 'center', paddingVertical: 12 },
  toggleText: { fontSize: 13, color: '#acb5ff', fontFamily: 'Pretendard-Medium' },
})
