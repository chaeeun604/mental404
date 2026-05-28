import { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { Colors } from '../constants/colors'
import type { ScreenProps } from '../types/navigation'

export default function SplashScreen({ navigation }: ScreenProps<'Splash'>) {
  const { session, loading: authLoading } = useAuth()
  const translateY = useRef(new Animated.Value(40)).current
  const opacity = useRef(new Animated.Value(0)).current
  const navigated = useRef(false)

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  useEffect(() => {
    if (authLoading || navigated.current) return
    const timer = setTimeout(() => {
      navigated.current = true
      navigation.replace(session ? 'Home' : 'Auth')
    }, 2000)
    return () => clearTimeout(timer)
  }, [authLoading, session])

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ translateY }], opacity }}>
        <Text style={styles.title}>MORBIT</Text>
        <Text style={styles.subtitle}>우주 아카이빙</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.primaryLight,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 2,
  },
})