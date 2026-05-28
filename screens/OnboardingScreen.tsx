import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import type { ScreenProps } from '../types/navigation'

export default function OnboardingScreen({ navigation }: ScreenProps<'Onboarding'>) {
  const { session } = useAuth()
  const username = session?.user?.user_metadata?.name
    ?? session?.user?.email?.split('@')[0]
    ?? '별님'

  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(24)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <View style={styles.container}>
      {/* Upper spacer area - dark background like Figma */}
      <View style={styles.upperArea} />

      {/* Bottom content area */}
      <Animated.View style={[styles.bottomArea, { opacity, transform: [{ translateY }] }]}>
        <View style={styles.textBlock}>
          <Text style={styles.greeting}>반가워요, {username}님!</Text>
          <Text style={styles.title}>
            {'MORBIT과 함께\n첫 별을 ⭐ 기록해볼까요?'}
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000845',
  },
  upperArea: {
    flex: 1,
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
    marginHorizontal: 0,
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
