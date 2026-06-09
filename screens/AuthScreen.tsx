import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  Platform, Animated, Easing,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
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

      const { getAllContents } = await import('../api/contents')
      const contents = await getAllContents(user.id)
      navigation.replace(contents.length === 0 ? 'Onboarding' : 'Home')
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

      <View style={styles.container}>
        <Animated.View style={{ opacity: restOpacity }}>
          <Text style={styles.tagline}>오늘의 별이 내일의 위로가 되도록</Text>
        </Animated.View>

        <Animated.View style={[styles.logoWrap, { transform: [{ translateY: logoY }] }]}>
          <PixelLogo dotSize={5.538} gap={1.107} letterSpacing={4} />
        </Animated.View>

        <Animated.View style={[styles.bottomContent, { opacity: restOpacity }]}>
          <View style={styles.constellationWrap}>
            <ConstellationGraphic />
          </View>

          <View style={styles.form}>
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
          </View>
        </Animated.View>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient:  { flex: 1 },
  star:      { position: 'absolute', backgroundColor: '#fbfcfe', opacity: 0.5 },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  tagline: {
    fontSize: 15,
    color: '#acb5ff',
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  logoWrap:          { marginBottom: 20 },
  bottomContent:     { alignItems: 'center', width: '100%' },
  constellationWrap: { marginBottom: 28 },
  form: { width: '100%', maxWidth: 350 },
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
})
