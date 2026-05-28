import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { useAuth } from '../hooks/useAuth'
import { useTags } from '../hooks/useTags'
import { getAllContents, getViewCountForPeriod } from '../api/contents'
import { Colors } from '../constants/colors'
import type { ScreenProps } from '../types/navigation'
import type { ContentWithTags } from '../types/database'

interface Period {
  label: string
  start: Date
  end: Date
  key: string
}

// 완료된 2주 구간만 생성 (end < 오늘)
function generateCompletedPeriods(count = 10): Period[] {
  const periods: Period[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 오늘 기준 직전 완료된 2주 구간부터
  // 가장 최근 완료 구간: 14일 전 종료
  let periodEnd = new Date(today)
  periodEnd.setDate(periodEnd.getDate() - 1) // 어제까지 = 최근 완료 구간의 끝

  for (let i = 0; i < count; i++) {
    const end = new Date(periodEnd)
    end.setHours(23, 59, 59, 999)
    const start = new Date(end)
    start.setDate(start.getDate() - 13)
    start.setHours(0, 0, 0, 0)

    const fmt = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`
    const key = `${start.toISOString().slice(0, 10)}_${end.toISOString().slice(0, 10)}`

    periods.push({ label: `${fmt(start)}~${fmt(end)}`, start, end, key })

    // 이전 구간으로 이동
    periodEnd.setDate(periodEnd.getDate() - 14)
  }

  return periods
}

async function getViewedPeriods(): Promise<Set<string>> {
  try {
    const key = 'morbit_report_viewed'
    let raw: string | null = null
    if (Platform.OS === 'web') raw = localStorage.getItem(key)
    else raw = await SecureStore.getItemAsync(key)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

async function markPeriodViewed(periodKey: string) {
  try {
    const key = 'morbit_report_viewed'
    const set = await getViewedPeriods()
    set.add(periodKey)
    const val = JSON.stringify(Array.from(set))
    if (Platform.OS === 'web') localStorage.setItem(key, val)
    else await SecureStore.setItemAsync(key, val)
  } catch {}
}

const TAG_COLORS = [
  '#534DFC', '#7C5FC8', '#3D7EC4', '#C45A5A', '#4FAF82',
  '#D4875C', '#8C5AD4', '#4DA6C4', '#C4A44D', '#6E8C4D',
]

export default function ReportScreen({ navigation }: ScreenProps<'Report'>) {
  const { session } = useAuth()
  const { tags } = useTags(session?.user?.id ?? '')
  const [contents, setContents]   = useState<ContentWithTags[]>([])
  const [loading, setLoading]     = useState(true)
  const [viewedPeriods, setViewedPeriods] = useState<Set<string>>(new Set())
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)
  const [periodViewCount, setPeriodViewCount] = useState(0)

  useEffect(() => {
    if (!session?.user?.id) return
    getAllContents(session.user.id)
      .then(setContents)
      .catch(() => {})
      .finally(() => setLoading(false))
    getViewedPeriods().then(setViewedPeriods)
  }, [session?.user?.id])

  const periods = generateCompletedPeriods(6)

  const getPeriodContents = (p: Period) =>
    contents.filter(c => {
      const d = new Date(c.created_at)
      return d >= p.start && d <= p.end
    })

  // 기간 있는 것만
  const activePeriods = periods.filter(p => getPeriodContents(p).length > 0)

  const openPeriod = async (period: Period) => {
    setSelectedPeriod(period)
    if (!viewedPeriods.has(period.key)) {
      await markPeriodViewed(period.key)
      setViewedPeriods(prev => new Set([...prev, period.key]))
    }
    // 열람 횟수 (view_logs)
    if (session?.user?.id) {
      const cnt = await getViewCountForPeriod(session.user.id, period.start, period.end)
      setPeriodViewCount(cnt)
    }
  }

  const getTagCount = (tagId: string, pc: ContentWithTags[]) =>
    pc.filter(c => c.content_tags?.some(ct => ct.tag_id === tagId)).length

  // ── 상세 뷰 ───────────────────────────────────────────────
  if (selectedPeriod) {
    const pc = getPeriodContents(selectedPeriod)
    const total = pc.length

    const tagCounts = tags
      .map((t, i) => ({ tag: t, count: getTagCount(t.id, pc), color: TAG_COLORS[i % TAG_COLORS.length] }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count)

    const topTag = tagCounts[0]

    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0b1831', '#03060d']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSelectedPeriod(null)} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{selectedPeriod.label}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 핵심 지표 2개 */}
            <View style={styles.statsRow}>
              <LinearGradient
                colors={['#3B21FB', '#AEF1FF']}
                start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                style={styles.statGradientCard}
              >
                <Text style={styles.statIcon}>✦</Text>
                <Text style={styles.statNum}>{total}</Text>
                <Text style={styles.statLabel}>저장한 별</Text>
              </LinearGradient>

              <View style={styles.statCard}>
                <Text style={styles.statNum}>{periodViewCount}</Text>
                <Text style={styles.statLabel}>스스로{'\n'}위로한 횟수</Text>
              </View>
            </View>

            {/* 가장 많이 사용한 태그 */}
            {topTag && (
              <View style={styles.topTagCard}>
                <Text style={styles.topTagLabel}>가장 많이 꺼내본 태그</Text>
                <View style={[styles.topTagBadge, { backgroundColor: topTag.color + '33' }]}>
                  <Text style={[styles.topTagName, { color: topTag.color }]}>{topTag.tag.name}</Text>
                </View>
                <Text style={styles.topTagCount}>{topTag.count}번</Text>
              </View>
            )}

            {/* 격려 메시지 */}
            {total > 0 && (
              <View style={styles.encourageCard}>
                <Text style={styles.encourageText}>
                  이번 2주, {total}개의 별을 기록하고{'\n'}
                  {periodViewCount}번이나 스스로를 위로했어요 ✦
                </Text>
              </View>
            )}

            {/* 태그별 기록 수 */}
            {tagCounts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>태그별 기록</Text>
                {tagCounts.map(({ tag, count, color }) => {
                  const pct = total > 0 ? count / total : 0
                  return (
                    <View key={tag.id} style={styles.barRow}>
                      <View style={[styles.tagDot, { backgroundColor: color }]} />
                      <Text style={styles.barLabel} numberOfLines={1}>{tag.name}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
                      </View>
                      <Text style={styles.barCount}>{count}</Text>
                    </View>
                  )
                })}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    )
  }

  // ── 목록 뷰 ───────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0b1831', '#03060d']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>분석 리포트</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : activePeriods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>아직 리포트가 없어요</Text>
            <Text style={styles.emptySubtext}>2주 이상 기록하면 분석 리포트를 받을 수 있어요.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {activePeriods.map((period, i) => {
              const count = getPeriodContents(period).length
              const isNewest = i === 0
              const isNew = isNewest && !viewedPeriods.has(period.key)
              return (
                <TouchableOpacity
                  key={period.key}
                  style={styles.periodCard}
                  onPress={() => openPeriod(period)}
                  activeOpacity={0.8}
                >
                  <View style={styles.periodCardInner}>
                    <View>
                      <View style={styles.periodLabelRow}>
                        <Text style={styles.periodLabel}>{period.label}</Text>
                        {isNew && (
                          <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>New</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.periodCount}>별 {count}개</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#0f1013' },
  safeArea:      { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  backBtn:     { padding: 12 },
  headerTitle: { fontSize: 18, fontFamily: 'Pretendard-SemiBold', color: '#fbfcfe' },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20, gap: 14, paddingBottom: 40 },
  periodCard: {
    backgroundColor: '#2d3052',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  periodCardInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  periodLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  periodLabel: { fontSize: 14, color: '#fbfcfe', fontFamily: 'Pretendard-Medium' },
  newBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: { fontSize: 11, color: '#fbfcfe', fontFamily: 'Pretendard-Bold' },
  periodCount:   { fontSize: 13, color: Colors.textSecondary, fontFamily: 'Pretendard-Regular' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle:     { fontSize: 16, color: Colors.textSecondary, fontFamily: 'Pretendard-Medium' },
  emptySubtext:   { fontSize: 13, color: Colors.textTertiary, textAlign: 'center', fontFamily: 'Pretendard-Regular' },

  // 상세 뷰
  statsRow: { flexDirection: 'row', gap: 12 },
  statGradientCard: {
    flex: 1, borderRadius: 16, padding: 20,
    alignItems: 'center', gap: 4,
  },
  statCard: {
    flex: 1, backgroundColor: '#2d3052', borderRadius: 16, padding: 20,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  statIcon: { fontSize: 20, color: '#fbfcfe' },
  statNum:  { fontSize: 32, fontFamily: 'Pretendard-Bold', color: '#fbfcfe' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontFamily: 'Pretendard-Regular' },
  topTagCard: {
    backgroundColor: '#2d3052', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  topTagLabel: { fontSize: 13, color: Colors.textTertiary, fontFamily: 'Pretendard-Regular' },
  topTagBadge: { flex: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  topTagName:  { fontSize: 13, fontFamily: 'Pretendard-SemiBold' },
  topTagCount: { fontSize: 14, color: '#fbfcfe', fontFamily: 'Pretendard-SemiBold' },
  encourageCard: {
    backgroundColor: '#2d3052', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: Colors.primary + '44',
  },
  encourageText: {
    fontSize: 17, fontFamily: 'Pretendard-SemiBold', color: '#fbfcfe',
    lineHeight: 26, letterSpacing: -0.2,
  },
  section:      { gap: 12 },
  sectionTitle: { fontSize: 14, color: Colors.textSecondary, fontFamily: 'Pretendard-Medium' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  barLabel: { fontSize: 12, color: Colors.textSecondary, width: 90, fontFamily: 'Pretendard-Regular' },
  barTrack: {
    flex: 1, height: 6, backgroundColor: Colors.surfaceBorder, borderRadius: 3, overflow: 'hidden',
  },
  barFill:  { height: '100%', borderRadius: 3 },
  barCount: { fontSize: 12, color: Colors.textTertiary, width: 24, textAlign: 'right', fontFamily: 'Pretendard-Regular' },
})
