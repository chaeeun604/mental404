import { useEffect, useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ScrollView, ActivityIndicator, Image, Platform,
} from 'react-native'

const NUMBER_IMAGES = [
  require('../assets/numbers/0.png'),
  require('../assets/numbers/1.png'),
  require('../assets/numbers/2.png'),
  require('../assets/numbers/3.png'),
  require('../assets/numbers/4.png'),
  require('../assets/numbers/5.png'),
  require('../assets/numbers/6.png'),
  require('../assets/numbers/7.png'),
  require('../assets/numbers/8.png'),
  require('../assets/numbers/9.png'),
]

function TodayNumericDate() {
  const d = new Date()
  const str = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  return (
    <View style={numStyles.row}>
      {str.split('').map((ch, i) =>
        ch === '.' ? (
          <Text key={i} style={numStyles.dot}>.</Text>
        ) : (
          <Image key={i} source={NUMBER_IMAGES[parseInt(ch)]} style={numStyles.digit} resizeMode="contain" />
        )
      )}
    </View>
  )
}

const numStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  digit: { width: 42, height: 60 },
  dot: {
    fontSize: 28,
    color: '#fbfcfe',
    fontFamily: 'Pretendard-Bold',
    lineHeight: 60,
    includeFontPadding: false,
  },
})

import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { useAuth } from '../hooks/useAuth'
import { getDailyRecommendation, getContentById } from '../api/contents'
import { logView } from '../api/viewLogs'
import { Colors } from '../constants/colors'
import type { ScreenProps } from '../types/navigation'
import type { ContentWithTags } from '../types/database'

const DAILY_STAR_KEY_PREFIX = 'morbit_daily_star_'

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function getCachedDailyStar(userId: string): Promise<string | null> {
  try {
    const key = DAILY_STAR_KEY_PREFIX + userId
    const raw = Platform.OS === 'web'
      ? localStorage.getItem(key)
      : await SecureStore.getItemAsync(key)
    if (!raw) return null
    const { date, contentId } = JSON.parse(raw)
    return date === getTodayStr() ? contentId : null
  } catch { return null }
}

async function cacheDailyStar(userId: string, contentId: string): Promise<void> {
  try {
    const key = DAILY_STAR_KEY_PREFIX + userId
    const value = JSON.stringify({ date: getTodayStr(), contentId })
    if (Platform.OS === 'web') localStorage.setItem(key, value)
    else await SecureStore.setItemAsync(key, value)
  } catch {}
}

export default function ShootingStarScreen({ navigation }: ScreenProps<'ShootingStar'>) {
  const { session } = useAuth()
  const [revealed, setRevealed]   = useState(false)
  const [content, setContent]     = useState<ContentWithTags | null | undefined>(undefined)
  const [loading, setLoading]     = useState(false)

  const shakeAnim   = useRef(new Animated.Value(0)).current
  const scaleAnim   = useRef(new Animated.Value(1)).current
  const boxOpacity  = useRef(new Animated.Value(1)).current
  const cardOpacity = useRef(new Animated.Value(0)).current
  const cardScale   = useRef(new Animated.Value(0.9)).current
  const shakeLoop   = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1500),
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 8,  duration: 70, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -8, duration: 70, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 3,  duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0,  duration: 50, useNativeDriver: true }),
        ]),
      ])
    )
    loop.start()
    shakeLoop.current = loop
    return () => loop.stop()
  }, [])

  const reveal = async () => {
    if (revealed || loading) return
    setLoading(true)
    shakeLoop.current?.stop()

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(scaleAnim,  { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(boxOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
    ]).start(async () => {
      try {
        const userId = session?.user?.id ?? ''
        let result: ContentWithTags | null = null

        const cachedId = await getCachedDailyStar(userId)
        if (cachedId) {
          result = await getContentById(cachedId)
        }
        if (!result) {
          result = await getDailyRecommendation(userId)
          if (result) await cacheDailyStar(userId, result.id)
        }

        setContent(result)
        if (result && userId) {
          await logView(userId, result.id).catch(() => {})
        }
      } catch {
        setContent(null)
      } finally {
        setLoading(false)
        setRevealed(true)
        Animated.parallel([
          Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(cardScale,   { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        ]).start()
      }
    })
  }

  const dateLabel = content
    ? new Date(content.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    : ''

  const imageUrl = content?.image_url && !content.image_url.startsWith('blob:')
    ? content.image_url
    : null

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#080711', '#101640', '#080711']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        {/* 헤더 — X 버튼 오른쪽 고정 */}
        <View style={styles.headerRow}>
          <View style={{ width: 44 }} />
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 날짜 — 별 공개 후에만 표시 */}
        {revealed && (
          <View style={styles.dateBlock}>
            <TodayNumericDate />
          </View>
        )}

        {/* 타이틀 */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>오늘은 어떤 별이{'\n'}떨어졌을까요?</Text>
          <Text style={styles.subtitle}>기록한 별 중 하나가 매일 랜덤으로 떨어져요.</Text>
        </View>

        {/* 미스터리 박스 */}
        {!revealed ? (
          <View style={styles.mysteryArea}>
            <TouchableOpacity onPress={reveal} activeOpacity={0.9} disabled={loading}>
              <Animated.View
                style={[
                  styles.mysteryBox,
                  {
                    transform: [{ translateX: shakeAnim }, { scale: scaleAnim }],
                    opacity: boxOpacity,
                  },
                ]}
              >
                {/* 내부 블루 글로우 */}
                <View style={styles.boxGlow} />
                <Text style={styles.questionMark}>?</Text>
                {loading && (
                  <ActivityIndicator
                    color={Colors.primaryLight}
                    style={StyleSheet.absoluteFill}
                  />
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>
        ) : (
          /* 공개된 콘텐츠 */
          <Animated.View
            style={[
              styles.revealArea,
              { opacity: cardOpacity, transform: [{ scale: cardScale }] },
            ]}
          >
            {content == null ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🌌</Text>
                <Text style={styles.emptyTitle}>아직 별이 없어요</Text>
                <Text style={styles.emptySubtitle}>
                  기억을 기록하면 여기서 다시 만날 수 있어요.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardScroll}>
                {/* 태그 칩 — #534DFC 배경 */}
                {content.content_tags && content.content_tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {content.content_tags.map(ct => (
                      <View key={ct.tag_id} style={styles.tagChip}>
                        <Text style={styles.tagChipText}>{ct.tags?.name}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* 이미지 */}
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.contentImage}
                    resizeMode="cover"
                  />
                ) : null}

                {/* 본문 — 22px SemiBold */}
                {content.body ? (
                  <Text style={styles.contentBody}>{content.body}</Text>
                ) : null}

                {/* 메모 — 독립 카드 */}
                {content.memo ? (
                  <View style={styles.memoCard}>
                    <Text style={styles.memoText}>{content.memo}</Text>
                  </View>
                ) : null}

                {/* 날짜 + 자세히 보기 */}
                <TouchableOpacity
                  style={styles.dateRow}
                  onPress={() => navigation.navigate('ContentDetail', { contentId: content.id })}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-forward-circle-outline" size={16} color="#9A9AB3" />
                  <Text style={styles.contentDate}>{dateLabel}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#080711' },
  safeArea:   { flex: 1 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 4,
  },
  closeBtn: { padding: 10 },

  dateBlock: {
    paddingLeft: 20,
    paddingBottom: 8,
  },

  titleSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Pretendard-SemiBold',
    color: '#fbfcfe',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#C3C3D8',
  },

  mysteryArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mysteryBox: {
    width: 248,
    height: 186,
    borderRadius: 32,
    backgroundColor: '#02061C',
    borderWidth: 1.5,
    borderColor: '#534dfc',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#534dfc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 12,
  },
  boxGlow: {
    position: 'absolute',
    top: -20,
    width: 218,
    height: 108,
    borderRadius: 109,
    backgroundColor: 'rgba(118,125,255,0.4)',
  },
  questionMark: {
    fontSize: 56,
    color: '#ACB5FF',
    fontFamily: 'Pretendard-Bold',
  },

  revealArea: { flex: 1, paddingHorizontal: 20 },
  cardScroll: { paddingBottom: 32, gap: 14 },

  // 태그 칩 — #534DFC 배경
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    backgroundColor: '#534DFC',
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tagChipText: { fontSize: 12, color: '#fbfcfe', fontFamily: 'Pretendard-Medium' },

  // 이미지
  contentImage: { width: '100%', height: 200, borderRadius: 16 },

  // 본문 — 22px SemiBold
  contentBody: {
    fontSize: 22,
    fontFamily: 'Pretendard-SemiBold',
    color: '#fbfcfe',
    lineHeight: 34,
  },

  // 메모 독립 카드
  memoCard: {
    backgroundColor: '#2D3052',
    borderRadius: 11,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  memoText: {
    fontSize: 16,
    color: '#fbfcfe',
    lineHeight: 24,
    fontFamily: 'Pretendard-Regular',
  },

  // 날짜 + 상세보기
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contentDate: { fontSize: 12, color: '#9A9AB3', fontFamily: 'Pretendard-Regular' },

  // 빈 상태
  emptyCard: {
    backgroundColor: '#272936',
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2D3052',
  },
  emptyIcon:     { fontSize: 48 },
  emptyTitle:    { fontSize: 18, fontFamily: 'Pretendard-SemiBold', color: '#fbfcfe' },
  emptySubtitle: { fontSize: 13, color: '#9A9AB3', textAlign: 'center', fontFamily: 'Pretendard-Regular' },
})
