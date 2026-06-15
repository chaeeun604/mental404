import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import StarField from '../components/StarField'
import SparkleIcon from '../components/SparkleIcon'
import type { ScreenProps } from '../types/navigation'

const SLIDES = [
  {
    text: '위로가 됐던 글과 사진,\n어떻게 보관하고 있나요?',
    tags: ['노래 가사', '책의 구절', '손편지'],
  },
  { text: 'MORBIT에 차곡차곡\n쌓아보세요.' },
  { text: '필요한 순간에 꺼내보며\n마음의 힘을 기를 수 있어요.' },
  { text: 'MORBIT과 함께' },
] as const

const HOLD_MS   = 2000
const ENTER_MS  = 500
const EXIT_MS   = 480
const ENTER_Y   = 30
const EXIT_Y    = -90

export default function OnboardingScreen({ navigation }: ScreenProps<'Onboarding'>) {
  const [slideIdx, setSlideIdx] = useState(0)

  const anims = useRef(
    SLIDES.map(() => ({
      opacity:    new Animated.Value(0),
      translateY: new Animated.Value(ENTER_Y),
    }))
  ).current

  const tagsOpacity = useRef(new Animated.Value(0)).current
  const btnOpacity  = useRef(new Animated.Value(0)).current

  function enterSlide(idx: number) {
    Animated.parallel([
      Animated.timing(anims[idx].opacity,    { toValue: 1, duration: ENTER_MS, useNativeDriver: true }),
      Animated.timing(anims[idx].translateY, { toValue: 0, duration: ENTER_MS, useNativeDriver: true }),
    ]).start(() => {
      if (idx === SLIDES.length - 1) {
        Animated.timing(btnOpacity, { toValue: 1, duration: 400, delay: 150, useNativeDriver: true }).start()
      }
    })
    if (idx === 0) {
      Animated.timing(tagsOpacity, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }).start()
    }
  }

  function exitToPrev(idx: number) {
    Animated.parallel([
      Animated.timing(anims[idx].opacity,    { toValue: 0.32, duration: EXIT_MS, useNativeDriver: true }),
      Animated.timing(anims[idx].translateY, { toValue: EXIT_Y, duration: EXIT_MS, useNativeDriver: true }),
    ]).start()
  }

  function fadeOutSlide(idx: number) {
    Animated.timing(anims[idx].opacity, { toValue: 0, duration: EXIT_MS, useNativeDriver: true }).start()
  }

  useEffect(() => { enterSlide(0) }, [])

  useEffect(() => {
    if (slideIdx >= SLIDES.length - 1) return

    const timer = setTimeout(() => {
      const next    = slideIdx + 1
      const toLast  = next === SLIDES.length - 1

      if (toLast) {
        // 마지막 슬라이드로 전환 시 이전 텍스트 모두 제거
        for (let i = 0; i <= slideIdx; i++) fadeOutSlide(i)
        Animated.timing(tagsOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start()
      } else {
        // 2단계 이전 슬라이드 완전히 제거
        if (slideIdx > 0) fadeOutSlide(slideIdx - 1)
        // 현재 슬라이드는 위로 올라가며 흐려짐
        exitToPrev(slideIdx)
        if (slideIdx === 0) {
          Animated.timing(tagsOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start()
        }
      }

      setTimeout(() => enterSlide(next), toLast ? 420 : 200)
      setSlideIdx(next)
    }, HOLD_MS)

    return () => clearTimeout(timer)
  }, [slideIdx])

  return (
    <LinearGradient colors={['#050928', '#080711']} style={styles.gradient}>
      <StarField />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* 태그 — 슬라이드 0 전용 */}
        <Animated.View style={[styles.tagsRow, { opacity: tagsOpacity }]} pointerEvents="none">
          {(SLIDES[0].tags as readonly string[]).map(tag => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </Animated.View>

        {/* 슬라이드 0–2: 동일 기준점에 absolute 배치 */}
        {SLIDES.slice(0, 3).map((slide, idx) => (
          <Animated.View
            key={idx}
            pointerEvents="none"
            style={[
              styles.slideItem,
              {
                opacity:   anims[idx].opacity,
                transform: [{ translateY: anims[idx].translateY }],
              },
            ]}
          >
            <Text style={styles.slideText}>{slide.text}</Text>
          </Animated.View>
        ))}

        {/* 슬라이드 3: 마지막 CTA, 중앙 배치 */}
        <Animated.View
          style={[
            styles.ctaWrap,
            {
              opacity:   anims[3].opacity,
              transform: [{ translateY: anims[3].translateY }],
            },
          ]}
          pointerEvents={slideIdx === 3 ? 'auto' : 'none'}
        >
          <Text style={styles.ctaText}>{SLIDES[3].text}</Text>
          <View style={styles.ctaStarRow}>
            <Text style={styles.ctaText}>첫 별을 </Text>
            <SparkleIcon size={26} color="#fbfcfe" />
            <Text style={styles.ctaText}> 기록해볼까요?</Text>
          </View>
        </Animated.View>

        {/* 시작하기 버튼 */}
        <Animated.View style={[styles.btnWrap, { opacity: btnOpacity }]}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.replace('Create')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>시작하기</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },

  tagsRow: {
    position: 'absolute',
    top: 240,
    left: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tagText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Pretendard-Regular',
  },

  slideItem: {
    position: 'absolute',
    top: 310,
    left: 24,
    right: 24,
  },
  slideText: {
    fontSize: 24,
    color: '#fbfcfe',
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: 36,
    textAlign: 'center',
  },

  ctaWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  ctaText: {
    fontSize: 26,
    color: '#fbfcfe',
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: 40,
    textAlign: 'center',
  },
  ctaStarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnWrap: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  btn: {
    backgroundColor: '#534dfc',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fbfcfe',
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
  },
})
