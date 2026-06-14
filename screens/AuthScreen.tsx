import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  Platform, Animated, Easing,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import PixelLogo from '../components/PixelLogo'
import ConstellationGraphic from '../components/ConstellationGraphic'
import type { ScreenProps } from '../types/navigation'

let _firstAuthMount = true

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

export default function AuthScreen({ navigation }: ScreenProps<'Auth'>) {
  const { signInWithKakao } = useAuth()
  const [kakaoLoading, setKakaoLoading] = useState(false)

  const isEntrance  = useRef(_firstAuthMount)
  const logoY       = useRef(new Animated.Value(_firstAuthMount ? 260 : 0)).current
  const restOpacity = useRef(new Animated.Value(_firstAuthMount ? 0 : 1)).current

  useEffect(() => {
    if (!isEntrance.current) return
    _firstAuthMount = false

    Animated.timing(logoY, {
      toValue: 0,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()

    Animated.timing(restOpacity, {
      toValue: 1,
      duration: 380,
      delay: 340,
      useNativeDriver: true,
    }).start()
  }, [])

  const handleKakao = async () => {
    setKakaoLoading(true)
    try {
      await signInWithKakao()
      if (Platform.OS === 'web') return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const kakaoNickname =
        user.user_metadata?.nickname ??
        user.user_metadata?.name ??
        user.user_metadata?.full_name ??
        null

      if (kakaoNickname && !user.user_metadata?.full_name) {
        await supabase.auth.updateUser({
          data: { full_name: kakaoNickname },
        })
      }

      navigation.replace('Onboarding')
    } catch (e: any) {
      Alert.alert('카카오 로그인 오류', e?.message ?? '다시 시도해주세요.')
    } finally {
      setKakaoLoading(false)
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

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          {/* 상단: 태그라인 + 로고 */}
          <View style={styles.topSection}>
            <Animated.View style={{ opacity: restOpacity }}>
              <Text style={styles.tagline}>오늘의 별이 내일의 위로가 되도록</Text>
            </Animated.View>
            <Animated.View style={{ transform: [{ translateY: logoY }] }}>
              <PixelLogo dotSize={5.538} gap={1.107} letterSpacing={4} />
            </Animated.View>
          </View>

          {/* 중앙: 별자리 그래픽 */}
          <Animated.View style={[styles.constellationWrap, { opacity: restOpacity }]}>
            <ConstellationGraphic />
          </Animated.View>

          {/* 유연한 여백 */}
          <View style={styles.spacer} />

          {/* 하단: 카카오 버튼 */}
          <Animated.View style={[styles.bottomSection, { opacity: restOpacity }]}>
            <TouchableOpacity
              style={[styles.kakaoBtn, kakaoLoading && styles.disabled]}
              onPress={handleKakao}
              disabled={kakaoLoading}
              activeOpacity={0.85}
            >
              {kakaoLoading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <>
                  <Text style={styles.kakaoIcon}>💬</Text>
                  <Text style={styles.kakaoText}>카카오로 시작하기</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.consent}>
              로그인 시, 서비스 이용관련에 동의하는 것으로 간주합니다.
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  star:     { position: 'absolute', backgroundColor: '#fbfcfe', opacity: 0.5 },

  safeArea:  { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },

  topSection: {
    paddingTop: 108,
    alignItems: 'center',
    gap: 20,
  },
  tagline: {
    fontSize: 15,
    color: '#acb5ff',
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  constellationWrap: {
    marginTop: 52,
    alignItems: 'center',
  },

  spacer: { flex: 1 },

  bottomSection: {
    paddingBottom: 40,
    gap: 14,
  },
  disabled: { opacity: 0.6 },
  kakaoBtn: {
    backgroundColor: '#FEE500',
    borderRadius: 14,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  kakaoIcon: { fontSize: 20 },
  kakaoText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Pretendard-SemiBold',
  },
  consent: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    fontFamily: 'Pretendard-Regular',
    textAlign: 'center',
  },
})
