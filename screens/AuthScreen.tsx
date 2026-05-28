import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../hooks/useAuth'
import { Colors } from '../constants/colors'
import type { ScreenProps } from '../types/navigation'

const STARS = [
  { top: '8%', left: '12%', size: 2 },
  { top: '5%', left: '75%', size: 1.5 },
  { top: '15%', left: '50%', size: 2.5 },
  { top: '22%', left: '30%', size: 1 },
  { top: '12%', left: '88%', size: 2 },
  { top: '30%', left: '8%', size: 1.5 },
  { top: '35%', left: '92%', size: 1 },
  { top: '72%', left: '5%', size: 2 },
  { top: '80%', left: '85%', size: 1.5 },
  { top: '88%', left: '20%', size: 1 },
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
    <LinearGradient colors={Colors.bgLoginGradient} style={styles.gradient}>
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
          <View style={styles.topSection}>
            <Text style={styles.logo}>MORBIT</Text>
            <Text style={styles.tagline}>오늘의 별이 내일의 기억이 되다</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>이메일</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor={Colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호</Text>
              <TextInput
                style={styles.input}
                placeholder="6자 이상"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '처리 중...' : isSignUp ? '시작하기' : '로그인'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsSignUp((v) => !v)} style={styles.toggle}>
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
  star: {
    position: 'absolute',
    backgroundColor: Colors.textPrimary,
    opacity: 0.6,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 60,
  },
  topSection: { alignItems: 'center', marginBottom: 56 },
  logo: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 6,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 13,
    color: Colors.primaryLight,
    letterSpacing: 0.5,
  },
  form: { gap: 0 },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  toggle: { marginTop: 20, alignItems: 'center' },
  toggleText: { color: Colors.primaryLight, fontSize: 14 },
})