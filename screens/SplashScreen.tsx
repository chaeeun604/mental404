import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { getAllContents } from '../api/contents'
import PixelLogo from '../components/PixelLogo'
import type { ScreenProps } from '../types/navigation'

export default function SplashScreen({ navigation }: ScreenProps<'Splash'>) {
  const { session, loading: authLoading } = useAuth()
  const opacity  = useRef(new Animated.Value(0)).current
  const scale    = useRef(new Animated.Value(0.92)).current
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

      if (!session) {
        navigation.replace('Auth')
        return
      }

      // 기록이 있으면 홈, 없으면 온보딩
      try {
        const contents = await getAllContents(session.user.id)
        navigation.replace(contents.length === 0 ? 'Onboarding' : 'Home')
      } catch {
        navigation.replace('Home')
      }
    }

    const timer = setTimeout(go, 2000)
    return () => clearTimeout(timer)
  }, [authLoading, session])

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <PixelLogo dotSize={5.538} gap={1.107} letterSpacing={4} />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000845',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
