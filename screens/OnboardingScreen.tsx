import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../hooks/useAuth'
import PlanetGraphic from '../components/PlanetGraphic'
import type { ScreenProps } from '../types/navigation'

const DECO_STARS = [
  { top: '8%',  left: '8%',  size: 2   },
  { top: '5%',  left: '75%', size: 1.5 },
  { top: '20%', left: '55%', size: 2.5 },
  { top: '25%', left: '22%', size: 1   },
  { top: '12%', left: '88%', size: 2   },
  { top: '35%', left: '5%',  size: 1.5 },
  { top: '38%', left: '90%', size: 1   },
]

export default function OnboardingScreen({ navigation }: ScreenProps<'Onboarding'>) {
  const { session } = useAuth()
  const username = session?.user?.user_metadata?.name
    ?? session?.user?.email?.split('@')[0]
    ?? '별님'

  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(24)).current
  const planetScale = useRef(new Animated.Value(0.85)).current
  const planetOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(planetOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(planetScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start()

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, delay: 300, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <LinearGradient colors={['#050928', '#080711']} style={styles.container}>
      {DECO_STARS.map((s, i) => (
        <View key={i} style={[styles.star, {
          top: s.top as any, left: s.left as any,
          width: s.size, height: s.size, borderRadius: s.size / 2,
        }]} />
      ))}

      {/* 상단 행성 그래픽 */}
      <Animated.View style={[styles.upperArea, {
        opacity: planetOpacity,
        transform: [{ scale: planetScale }],
      }]}>
        <PlanetGraphic tagIndex={0} size={220} />
      </Animated.View>

      {/* 하단 텍스트 + 버튼 */}
      <Animated.View style={[styles.bottomArea, { opacity, transform: [{ translateY }] }]}>
        <View style={styles.textBlock}>
          <Text style={styles.greeting}>반가워요, {username}님!</Text>
          <Text style={styles.title}>
            {'MORBIT과 함께\n첫 별을 ✦ 기록해볼까요?'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace('Create')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>시작하기</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#fbfcfe',
    opacity: 0.45,
  },
  upperArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 40,
  },
  textBlock: {
    gap: 16,
    paddingLeft: 20,
  },
  greeting: {
    fontSize: 20,
    color: '#acb5ff',
    fontFamily: 'Pretendard-Medium',
    lineHeight: 29,
  },
  title: {
    fontSize: 24,
    color: '#fbfcfe',
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: 35,
  },
  button: {
    backgroundColor: '#534dfc',
    borderRadius: 11,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    width: 350,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fbfcfe',
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
  },
})
