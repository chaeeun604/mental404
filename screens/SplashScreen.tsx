import { useEffect, useRef } from 'react'
import { Animated, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../hooks/useAuth'
import { getAllContents } from '../api/contents'
import PixelLogo from '../components/PixelLogo'
import type { RootStackParamList } from '../types/navigation'
import type { ScreenProps } from '../types/navigation'

export default function SplashScreen({ navigation }: ScreenProps<'Splash'>) {
  const { session, loading: authLoading } = useAuth()
  const opacity   = useRef(new Animated.Value(0)).current
  const scale     = useRef(new Animated.Value(0.92)).current
  const navigated = useRef(false)

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start()
  }, [])

  useEffect(() => {
    if (authLoading || navigated.current) return

    const go = async () => {
      navigated.current = true
      let target: keyof RootStackParamList = 'Auth'
      if (session) {
        try {
          const contents = await getAllContents(session.user.id)
          target = contents.length === 0 ? 'Onboarding' : 'Home'
        } catch { target = 'Home' }
      }
      navigation.replace(target)
    }

    const timer = setTimeout(go, 1800)
    return () => clearTimeout(timer)
  }, [authLoading, session])

  return (
    <LinearGradient colors={['#050928', '#080711']} style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <PixelLogo dotSize={5.538} gap={1.107} letterSpacing={4} />
      </Animated.View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
