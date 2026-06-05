import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../hooks/useAuth'
import StarField from '../components/StarField'
import type { ScreenProps } from '../types/navigation'

export default function OnboardingScreen({ navigation }: ScreenProps<'Onboarding'>) {
  const { session } = useAuth()
  const username = session?.user?.user_metadata?.name
    ?? session?.user?.email?.split('@')[0]
    ?? '별님'

  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(32)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <LinearGradient colors={['#050928', '#080711']} style={styles.container}>
      <StarField />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* 상단 여백 영역 */}
        <View style={styles.spacer} />

        {/* 하단 텍스트 + 버튼 */}
        <Animated.View style={[styles.bottomArea, { opacity, transform: [{ translateY }] }]}>
          <View style={styles.textBlock}>
            <Text style={styles.greeting}>반가워요, {username}님!</Text>
            <Text style={styles.title}>{'MORBIT과 함께\n첫 별을 🌟 기록해볼까요?'}</Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.replace('Create')}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>시작하기</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'flex-end' },
  spacer: { flex: 1 },
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 40,
  },
  textBlock: {
    gap: 12,
    paddingLeft: 4,
  },
  greeting: {
    fontSize: 18,
    color: '#acb5ff',
    fontFamily: 'Pretendard-Medium',
    lineHeight: 26,
  },
  title: {
    fontSize: 26,
    color: '#fbfcfe',
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: 38,
  },
  button: {
    backgroundColor: '#534dfc',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fbfcfe',
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
  },
})
