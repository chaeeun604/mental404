import { useEffect, useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ScrollView, ActivityIndicator, Image,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../hooks/useAuth'
import { getDailyRecommendation } from '../api/contents'
import { logView } from '../api/viewLogs'
import { Colors } from '../constants/colors'
import type { ScreenProps } from '../types/navigation'
import type { ContentWithTags } from '../types/database'

export default function ShootingStarScreen({ navigation }: ScreenProps<'ShootingStar'>) {
  const { session } = useAuth()
  const [revealed, setRevealed]   = useState(false)
  const [content, setContent]     = useState<ContentWithTags | null | undefined>(undefined)
  const [loading, setLoading]     = useState(false)

  // 애니메이션 값들
  const shakeAnim   = useRef(new Animated.Value(0)).current
  const scaleAnim   = useRef(new Animated.Value(1)).current
  const boxOpacity  = useRef(new Animated.Value(1)).current
  const cardOpacity = useRef(new Animated.Value(0)).current
  const cardScale   = useRef(new Animated.Value(0.9)).current
  const shakeLoop   = useRef<Animated.CompositeAnimation | null>(null)

  // 박스가 주기적으로 흔들리는 애니메이션
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

    // 박스 터지는 효과: 커졌다가 사라짐
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(scaleAnim,  { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(boxOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
    ]).start(async () => {
      try {
        const result = await getDailyRecommendation(session?.user?.id ?? '')
        setContent(result)
        if (result && session?.user?.id) {
          await logView(session.user.id, result.id).catch(() => {})
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#080711', '#101640', '#080711']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        {/* 상단 닫기 */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={28} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* 타이틀 */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>오늘은 어떤 별이{'\n'}떨어졌을까요?</Text>
          <Text style={styles.subtitle}>기록한 별 중 하나가 당신을 찾아왔어요.</Text>
        </View>

        {/* 미스터리 박스 */}
        {!revealed ? (
          <View style={styles.mysteryArea}>
            <TouchableOpacity onPress={reveal} activeOpacity={0.9} disabled={loading}>
              <Animated.View
                style={[
                  styles.mysteryBox,
                  {
                    transform: [
                      { translateX: shakeAnim },
                      { scale: scaleAnim },
                    ],
                    opacity: boxOpacity,
                  },
                ]}
              >
                <LinearGradient
                  colors={['#1a1040', '#2d1f7a']}
                  style={styles.boxGradient}
                >
                  <Text style={styles.starEmoji}>✦</Text>
                  {loading && (
                    <ActivityIndicator
                      color={Colors.primaryLight}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.tapHint}>상자를 눌러 별을 확인하세요</Text>
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
                <View style={styles.contentCard}>
                  {/* 이미지형 */}
                  {content.type === 'image' && content.image_url ? (
                    <Image
                      source={{ uri: content.image_url }}
                      style={styles.contentImage}
                      resizeMode="cover"
                    />
                  ) : null}

                  {/* 날짜 + 태그 */}
                  <View style={styles.metaRow}>
                    <Text style={styles.contentDate}>{dateLabel}</Text>
                    <View style={styles.tagRow}>
                      {content.content_tags?.map(ct => (
                        <View key={ct.tag_id} style={styles.tagChip}>
                          <Text style={styles.tagChipText}>{ct.tags?.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* 본문 */}
                  {content.type === 'text' && content.body ? (
                    <Text style={styles.contentBody}>{content.body}</Text>
                  ) : null}

                  {/* 메모 */}
                  {content.memo ? (
                    <View style={styles.memoSection}>
                      <Text style={styles.memoLabel}>메모</Text>
                      <Text style={styles.memoText}>{content.memo}</Text>
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.detailBtn}
                  onPress={() => navigation.navigate('ContentDetail', { contentId: content.id })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.detailBtnText}>자세히 보기</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fbfcfe" />
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
  container:    { flex: 1, backgroundColor: '#080711' },
  safeArea:     { flex: 1 },
  closeBtn:     { alignSelf: 'center', padding: 14, marginTop: 4 },
  titleSection: { alignItems: 'center', paddingHorizontal: 32, paddingBottom: 24, gap: 8 },
  title: {
    fontSize: 24,
    fontFamily: 'Pretendard-SemiBold',
    color: '#fbfcfe',
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    color: '#9A9AB3',
    textAlign: 'center',
  },
  mysteryArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  mysteryBox:  { borderRadius: 28, overflow: 'hidden' },
  boxGradient: {
    width: 180,
    height: 180,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#534dfc',
    shadowColor: '#534dfc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 12,
  },
  starEmoji: { fontSize: 64, color: '#acb5ff' },
  tapHint: {
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    color: '#636887',
    letterSpacing: 0.2,
  },
  revealArea: { flex: 1, paddingHorizontal: 20 },
  cardScroll: { paddingBottom: 32 },
  contentCard: {
    backgroundColor: '#272936',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D3052',
    gap: 16,
    marginBottom: 14,
  },
  contentImage: { width: '100%', height: 200 },
  metaRow: { paddingHorizontal: 20, paddingTop: 16, gap: 8 },
  contentDate: { fontSize: 12, color: '#636887', fontFamily: 'Pretendard-Regular' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip: {
    backgroundColor: '#2D3052',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagChipText: { fontSize: 12, color: '#acb5ff', fontFamily: 'Pretendard-Medium' },
  contentBody: {
    fontSize: 16,
    color: '#fbfcfe',
    lineHeight: 26,
    fontFamily: 'Pretendard-Regular',
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  memoSection: {
    borderTopWidth: 1,
    borderTopColor: '#2D3052',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 6,
  },
  memoLabel: { fontSize: 11, color: '#636887', fontFamily: 'Pretendard-Medium' },
  memoText: { fontSize: 13, color: '#9A9AB3', lineHeight: 20, fontFamily: 'Pretendard-Regular' },
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
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#534dfc',
    borderRadius: 14,
    paddingVertical: 16,
  },
  detailBtnText: { fontSize: 15, color: '#fbfcfe', fontFamily: 'Pretendard-SemiBold' },
})
