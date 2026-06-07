import { useState, useEffect } from 'react'
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
import { getAllContents } from '../api/contents'
import { getViewLogsForPeriod } from '../api/viewLogs'
import { Colors } from '../constants/colors'
import PlanetGraphic from '../components/PlanetGraphic'
import type { ScreenProps } from '../types/navigation'
import type { ContentWithTags } from '../types/database'

interface Period {
  label: string
  start: Date
  end: Date
  key: string
}

interface ViewLog {
  content_id: string
  tag_id: string | null
  viewed_at: string
}

function generateCompletedPeriods(count = 10): Period[] {
  const periods: Period[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let periodEnd = new Date(today)
  periodEnd.setDate(periodEnd.getDate() - 1)
  for (let i = 0; i < count; i++) {
    const end = new Date(periodEnd)
    end.setHours(23, 59, 59, 999)
    const start = new Date(end)
    start.setDate(start.getDate() - 13)
    start.setHours(0, 0, 0, 0)
    const fmt = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`
    const key = `${start.toISOString().slice(0, 10)}_${end.toISOString().slice(0, 10)}`
    periods.push({ label: `${fmt(start)}~${fmt(end)}`, start, end, key })
    periodEnd.setDate(periodEnd.getDate() - 14)
  }
  return periods
}

async function getViewedPeriods(): Promise<Set<string>> {
  try {
    const key = 'morbit_report_viewed'
    const raw = Platform.OS === 'web'
      ? localStorage.getItem(key)
      : await SecureStore.getItemAsync(key)
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

const DAY_NAMES   = ['월', '화', '수', '목', '금', '토', '일']
const DAY_FULL    = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']
const TIME_BANDS  = ['새벽', '오전', '오후', '저녁', '밤']

function getDayIdx(date: Date): number {
  const d = date.getDay()
  return d === 0 ? 6 : d - 1
}

function getTimeBandIdx(hour: number): number {
  if (hour <= 5) return 0
  if (hour <= 11) return 1
  if (hour <= 17) return 2
  if (hour <= 20) return 3
  return 4
}

function computeDayCounts(logs: ViewLog[]): number[] {
  const counts = new Array(7).fill(0)
  for (const l of logs) counts[getDayIdx(new Date(l.viewed_at))]++
  return counts
}

function computeTimeCounts(logs: ViewLog[]): number[] {
  const counts = new Array(5).fill(0)
  for (const l of logs) counts[getTimeBandIdx(new Date(l.viewed_at).getHours())]++
  return counts
}

function filterByTag(logs: ViewLog[], contents: ContentWithTags[], tagId: string | null): ViewLog[] {
  if (!tagId) return logs
  return logs.filter(l => {
    const c = contents.find(c => c.id === l.content_id)
    return c?.content_tags?.some(ct => ct.tag_id === tagId)
  })
}

function computeTagViewCounts(logs: ViewLog[], contents: ContentWithTags[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const l of logs) {
    const c = contents.find(c => c.id === l.content_id)
    if (!c) continue
    for (const ct of c.content_tags ?? []) {
      counts[ct.tag_id] = (counts[ct.tag_id] ?? 0) + 1
    }
  }
  return counts
}

function getMostViewedContent(logs: ViewLog[], contents: ContentWithTags[]): ContentWithTags | null {
  if (!logs.length) return null
  const cnt: Record<string, number> = {}
  for (const l of logs) cnt[l.content_id] = (cnt[l.content_id] ?? 0) + 1
  const maxId = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]?.[0]
  return contents.find(c => c.id === maxId) ?? null
}

function peakDayTimeText(logs: ViewLog[]): string {
  if (!logs.length) return '아직 꺼내본 기록이 없어요.'
  const dc = computeDayCounts(logs)
  const tc = computeTimeCounts(logs)
  const pd = dc.indexOf(Math.max(...dc))
  const pt = tc.indexOf(Math.max(...tc))
  return `${DAY_FULL[pd]} ${TIME_BANDS[pt]}에 별을 가장 자주 꺼내봤어요.`
}

export default function ReportScreen({ navigation }: ScreenProps<'Report'>) {
  const { session } = useAuth()
  const { tags } = useTags(session?.user?.id ?? '')
  const [contents, setContents]         = useState<ContentWithTags[]>([])
  const [loading, setLoading]           = useState(true)
  const [viewedPeriods, setViewedPeriods] = useState<Set<string>>(new Set())
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)
  const [periodViewLogs, setPeriodViewLogs] = useState<ViewLog[]>([])
  const [filterTagId, setFilterTagId]   = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

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
  const activePeriods = periods.filter(p => getPeriodContents(p).length > 0)

  const openPeriod = async (period: Period) => {
    setSelectedPeriod(period)
    setFilterTagId(null)
    setPeriodViewLogs([])
    if (!viewedPeriods.has(period.key)) {
      await markPeriodViewed(period.key)
      setViewedPeriods(prev => new Set([...prev, period.key]))
    }
    if (session?.user?.id) {
      setDetailLoading(true)
      try {
        const logs = await getViewLogsForPeriod(session.user.id, period.start, period.end)
        setPeriodViewLogs(logs)
      } catch {}
      finally { setDetailLoading(false) }
    }
  }

  // ── 상세 뷰 ───────────────────────────────────────────────
  if (selectedPeriod) {
    const pc        = getPeriodContents(selectedPeriod)
    const total     = pc.length
    const tagVCMap  = computeTagViewCounts(periodViewLogs, contents)
    const totalViews = periodViewLogs.length

    // 가장 자주 꺼내본 태그
    const topViewedTagEntry = Object.entries(tagVCMap).sort((a, b) => b[1] - a[1])[0]
    const topViewedTag = tags.find(t => t.id === topViewedTagEntry?.[0])
    const topViewedTagIndex = tags.findIndex(t => t.id === topViewedTagEntry?.[0])

    // 가장 많이 꺼내본 별
    const mostViewed = getMostViewedContent(periodViewLogs, contents)

    // 태그별 view count 정렬 (stacked bar + list)
    const tagViewList = tags
      .map((t, i) => ({ tag: t, count: tagVCMap[t.id] ?? 0, color: TAG_COLORS[i % TAG_COLORS.length] }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count)

    // 총 태그 view count 합 (stacked bar용)
    const totalTagViews = tagViewList.reduce((s, x) => s + x.count, 0)

    // 요일/시간대 분석
    const filteredLogs  = filterByTag(periodViewLogs, contents, filterTagId)
    const dayCounts     = computeDayCounts(filteredLogs)
    const timeCounts    = computeTimeCounts(filteredLogs)
    const maxDay        = Math.max(...dayCounts, 1)
    const maxTime       = Math.max(...timeCounts, 1)
    const peakText      = peakDayTimeText(filteredLogs)

    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0b1831', '#03060d']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safeArea}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={{ width: 36 }} />
            <Text style={styles.headerTitle}>{selectedPeriod.label}</Text>
            <TouchableOpacity onPress={() => setSelectedPeriod(null)} style={styles.headerBtn}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.detailContent}
            showsVerticalScrollIndicator={false}
          >
            {detailLoading && (
              <ActivityIndicator color={Colors.primary} style={{ marginBottom: 8 }} />
            )}

            {/* ── 스탯 2카드 ── */}
            <View style={styles.statsRow}>
              <LinearGradient
                colors={['#3B21FB', '#A5F0FF']}
                start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.statGradCard}
              >
                <Text style={styles.statStarIcon}>✦</Text>
                <Text style={styles.statNumLarge}>{total}</Text>
                <Text style={styles.statSubLabel}>저장한 별의 개수</Text>
              </LinearGradient>

              <View style={styles.statDarkCard}>
                {topViewedTagIndex >= 0 && (
                  <View style={styles.statTagBgPlanet}>
                    <PlanetGraphic tagIndex={topViewedTagIndex} size={80} />
                  </View>
                )}
                <PlanetGraphic tagIndex={topViewedTagIndex >= 0 ? topViewedTagIndex : 0} size={36} />
                <Text style={styles.statTagName} numberOfLines={1}>
                  {topViewedTag?.name ?? '—'}
                </Text>
                <Text style={styles.statSubLabel}>가장 자주 꺼내본 태그</Text>
              </View>
            </View>

            {/* ── 가장 많이 꺼내본 별 ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>가장 많이 꺼내본 별</Text>
              <View style={styles.card}>
                <Text style={styles.mostViewedText} numberOfLines={3}>
                  {mostViewed?.body ?? (mostViewed ? '이미지 기록' : '꺼내본 기록이 없어요.')}
                </Text>
              </View>
            </View>

            {/* ── 위로 횟수 + stacked bar ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {`이번 2주는 ${totalViews}번이나\n스스로를 위로해냈어요!`}
              </Text>
              <View style={styles.card}>
                {/* Stacked bar */}
                {totalTagViews > 0 ? (
                  <View style={styles.stackedBar}>
                    {tagViewList.map(({ tag, count, color }) => (
                      <View
                        key={tag.id}
                        style={[styles.stackedSegment, { flex: count, backgroundColor: color }]}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={[styles.stackedBar, { backgroundColor: Colors.surfaceBorder }]} />
                )}

                {/* 2-column tag list */}
                <View style={styles.tagGrid}>
                  {tagViewList.map((item, i) => (
                    i % 2 === 0 ? (
                      <View key={item.tag.id} style={styles.tagGridRow}>
                        <View style={styles.tagGridItem}>
                          <View style={[styles.tagDot, { backgroundColor: item.color }]} />
                          <Text style={styles.tagGridName} numberOfLines={1}>{item.tag.name}</Text>
                          <Text style={styles.tagGridCount}>{item.count}번</Text>
                        </View>
                        {tagViewList[i + 1] && (
                          <View style={styles.tagGridItem}>
                            <View style={[styles.tagDot, { backgroundColor: tagViewList[i + 1].color }]} />
                            <Text style={styles.tagGridName} numberOfLines={1}>{tagViewList[i + 1].tag.name}</Text>
                            <Text style={styles.tagGridCount}>{tagViewList[i + 1].count}번</Text>
                          </View>
                        )}
                      </View>
                    ) : null
                  ))}
                  {tagViewList.length === 0 && (
                    <Text style={styles.emptyHint}>꺼내본 기록이 없어요.</Text>
                  )}
                </View>
              </View>
            </View>

            {/* ── 요일 시간대 분석 ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{peakText}</Text>
              <View style={[styles.card, { gap: 20 }]}>
                {/* 필터 칩 */}
                <View style={styles.filterChipRow}>
                  <TouchableOpacity
                    style={[styles.filterChip, filterTagId === null && styles.filterChipActive]}
                    onPress={() => setFilterTagId(null)}
                  >
                    <Text style={[styles.filterChipText, filterTagId === null && styles.filterChipTextActive]}>
                      전체
                    </Text>
                  </TouchableOpacity>
                  {tags.map(tag => (
                    <TouchableOpacity
                      key={tag.id}
                      style={[styles.filterChip, filterTagId === tag.id && styles.filterChipActive]}
                      onPress={() => setFilterTagId(tag.id)}
                    >
                      <Text style={[styles.filterChipText, filterTagId === tag.id && styles.filterChipTextActive]}>
                        {tag.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 요일 바 차트 */}
                <View style={styles.dayBarsRow}>
                  {DAY_NAMES.map((name, i) => {
                    const count = dayCounts[i]
                    const isPeak = count === Math.max(...dayCounts) && count > 0
                    const barH = maxDay > 0 ? Math.max(4, Math.round((count / maxDay) * 80)) : 4
                    return (
                      <View key={name} style={styles.dayBarCol}>
                        <Text style={[styles.dayBarCount, isPeak && styles.dayBarCountPeak]}>
                          {count}
                        </Text>
                        <View
                          style={[
                            styles.dayBar,
                            { height: barH, backgroundColor: isPeak ? '#534dfc' : '#636887' },
                          ]}
                        />
                        <Text style={[styles.dayBarLabel, isPeak && styles.dayBarLabelPeak]}>
                          {name}
                        </Text>
                      </View>
                    )
                  })}
                </View>

                {/* 시간대 바 */}
                <View style={styles.timeStrip}>
                  {TIME_BANDS.map((band, i) => {
                    const count = timeCounts[i]
                    const fillPct = maxTime > 0 ? (count / maxTime) * 100 : 0
                    return (
                      <View key={band} style={styles.timeRow}>
                        <Text style={styles.timeBandLabel}>{band}</Text>
                        <View style={styles.timeTrack}>
                          <View
                            style={[styles.timeFill, { width: `${fillPct}%` as any }]}
                          />
                        </View>
                        <Text style={styles.timeCount}>{count}</Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            </View>
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>분석 리포트</Text>
          <View style={{ width: 36 }} />
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
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {activePeriods.map((period, i) => {
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
                    <View style={styles.periodLabelRow}>
                      <Text style={styles.periodLabel}>{period.label}</Text>
                      {isNew && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>New</Text>
                        </View>
                      )}
                    </View>
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
  headerBtn:     { padding: 12 },
  headerTitle:   { fontSize: 18, fontFamily: 'Pretendard-SemiBold', color: '#fbfcfe' },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // 목록 뷰
  listContent: { padding: 20, gap: 12, paddingBottom: 40 },
  periodCard: {
    backgroundColor: '#2d3052',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  periodCardInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  periodLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  periodLabel:     { fontSize: 14, color: '#fbfcfe', fontFamily: 'Pretendard-Medium' },
  newBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  newBadgeText: { fontSize: 12, color: '#fbfcfe', fontFamily: 'Pretendard-Medium' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle:     { fontSize: 16, color: Colors.textSecondary, fontFamily: 'Pretendard-Medium' },
  emptySubtext:   { fontSize: 13, color: Colors.textTertiary, textAlign: 'center', fontFamily: 'Pretendard-Regular' },

  // 상세 뷰 공통
  detailContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 120, gap: 32 },
  section:       { gap: 12 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-SemiBold',
    color: '#fbfcfe',
    letterSpacing: -0.18,
    lineHeight: 26,
  },
  card: {
    backgroundColor: '#272936',
    borderRadius: 15,
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
    overflow: 'hidden',
  },

  // 스탯 2카드
  statsRow: { flexDirection: 'row', gap: 12 },
  statGradCard: {
    flex: 1,
    borderRadius: 15,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  statDarkCard: {
    flex: 1,
    backgroundColor: '#272936',
    borderRadius: 15,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  statStarIcon:   { fontSize: 22, color: '#fbfcfe' },
  statNumLarge: {
    fontSize: 18,
    fontFamily: 'Pretendard-SemiBold',
    color: '#fbfcfe',
    lineHeight: 25,
  },
  statSubLabel: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  statTagRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statTagBgPlanet: {
    position: 'absolute',
    bottom: -16,
    right: -16,
    opacity: 0.18,
  },
  statTagName: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    color: '#fbfcfe',
    textAlign: 'center',
  },

  // 가장 많이 꺼내본 별
  mostViewedText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#fbfcfe',
    lineHeight: 22,
  },

  // Stacked bar
  stackedBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 10,
    gap: 4,
    overflow: 'hidden',
  },
  stackedSegment: {
    height: 14,
    borderRadius: 10,
  },

  // Tag 2-column grid
  tagGrid:    { gap: 8 },
  tagGridRow: { flexDirection: 'row', gap: 12 },
  tagGridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagDot:      { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  tagGridName: {
    flex: 1,
    fontSize: 12,
    color: '#fbfcfe',
    fontFamily: 'Pretendard-Regular',
  },
  tagGridCount: {
    fontSize: 12,
    color: '#9a9ab3',
    fontFamily: 'Pretendard-Regular',
    width: 24,
    textAlign: 'right',
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontFamily: 'Pretendard-Regular',
  },

  // 필터 칩
  filterChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    borderWidth: 1,
    borderColor: '#636887',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: '#534dfc',
    borderColor: '#534dfc',
  },
  filterChipText: {
    fontSize: 12,
    color: '#9a9ab3',
    fontFamily: 'Pretendard-Regular',
  },
  filterChipTextActive: {
    color: '#fbfcfe',
    fontFamily: 'Pretendard-Medium',
  },

  // 요일 바 차트
  dayBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    gap: 4,
  },
  dayBarCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  dayBarCount: {
    fontSize: 10,
    color: '#9a9ab3',
    fontFamily: 'Pretendard-Regular',
  },
  dayBarCountPeak: {
    color: '#fbfcfe',
    fontFamily: 'Pretendard-SemiBold',
  },
  dayBar: {
    width: '100%',
    borderRadius: 8,
    minHeight: 4,
  },
  dayBarLabel: {
    fontSize: 11,
    color: '#9a9ab3',
    fontFamily: 'Pretendard-Regular',
  },
  dayBarLabelPeak: {
    color: '#fbfcfe',
    fontFamily: 'Pretendard-Medium',
  },

  // 시간대 바
  timeStrip: { gap: 8 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    height: 12,
  },
  timeBandLabel: {
    fontSize: 12,
    color: '#fbfcfe',
    fontFamily: 'Pretendard-Regular',
    width: 28,
  },
  timeTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#2d3052',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  timeFill: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    backgroundColor: '#534dfc',
    borderRadius: 6,
  },
  timeCount: {
    fontSize: 12,
    color: '#fbfcfe',
    fontFamily: 'Pretendard-Medium',
    width: 16,
    textAlign: 'center',
  },
})
