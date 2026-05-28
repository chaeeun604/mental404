import { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../hooks/useAuth'
import { useTags } from '../hooks/useTags'
import { getAllContents } from '../api/contents'
import { Colors } from '../constants/colors'
import type { ScreenProps } from '../types/navigation'
import type { ContentWithTags } from '../types/database'

interface Period {
  label: string
  start: Date
  end: Date
}

function generatePeriods(count = 6): Period[] {
  const periods: Period[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const end = new Date(now)
    end.setDate(end.getDate() - i * 14)
    end.setHours(23, 59, 59, 999)
    const start = new Date(end)
    start.setDate(start.getDate() - 13)
    start.setHours(0, 0, 0, 0)
    const fmt = (d: Date) =>
      `${d.getMonth() + 1}월 ${d.getDate()}일`
    periods.push({ label: `${fmt(start)}-${fmt(end)}`, start, end })
  }
  return periods
}

const TAG_COLORS = [
  '#534DFC', '#7C5FC8', '#3D7EC4', '#C45A5A', '#4FAF82',
  '#D4875C', '#8C5AD4', '#4DA6C4', '#C4A44D', '#6E8C4D',
]

export default function ReportScreen({ navigation }: ScreenProps<'Report'>) {
  const { session } = useAuth()
  const { tags } = useTags(session?.user?.id ?? '')
  const [contents, setContents] = useState<ContentWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    getAllContents(session.user.id)
      .then(setContents)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session?.user?.id])

  const periods = generatePeriods(6)

  const getPeriodContents = (period: Period) =>
    contents.filter((c) => {
      const d = new Date(c.created_at)
      return d >= period.start && d <= period.end
    })

  // Only show periods that have at least one record
  const activePeriods = periods.filter((p) => getPeriodContents(p).length > 0)

  const getTagCount = (tagId: string, pc: ContentWithTags[]) =>
    pc.filter((c) => c.content_tags?.some((ct) => ct.tag_id === tagId)).length

  if (selectedPeriod) {
    const pc = getPeriodContents(selectedPeriod)
    const total = pc.length

    const tagCounts = tags
      .map((t, i) => ({ tag: t, count: getTagCount(t.id, pc), color: TAG_COLORS[i % TAG_COLORS.length] }))
      .sort((a, b) => b.count - a.count)

    const topTag = tagCounts[0]
    const mostRecent = pc[0]
    const encourageCount = total

    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSelectedPeriod(null)}>
              <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{selectedPeriod.label}</Text>
            <TouchableOpacity onPress={() => setSelectedPeriod(null)}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Stat cards */}
            <View style={styles.statsRow}>
              <LinearGradient
                colors={['#3B21FB', '#AEF1FF']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.statCardGradient}
              >
                <Text style={styles.statIcon}>✦</Text>
                <Text style={styles.statNumber}>{total}</Text>
                <Text style={styles.statLabel}>저장한 별의 수</Text>
              </LinearGradient>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{topTag?.count ?? 0}</Text>
                <Text style={styles.statLabel}>가장 자주{'\n'}꺼내는 태그</Text>
                {topTag && topTag.count > 0 && (
                  <Text style={styles.statTagName} numberOfLines={1}>{topTag.tag.name}</Text>
                )}
              </View>
            </View>

            {/* Most saved content */}
            {mostRecent && mostRecent.body ? (
              <View style={styles.featuredCard}>
                <Text style={styles.featuredLabel}>가장 많이 꺼내본 별</Text>
                <Text style={styles.featuredBody}>
                  {mostRecent.body.length > 80
                    ? mostRecent.body.slice(0, 79) + '…'
                    : mostRecent.body}
                </Text>
              </View>
            ) : null}

            {/* Encouragement */}
            {total > 0 && (
              <View style={styles.encourageCard}>
                <Text style={styles.encourageText}>
                  이번 2주는 {encourageCount}번이나{'\n'}스스로를 위로해냈어요!
                </Text>
              </View>
            )}

            {/* Tag breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>태그별 기록</Text>
              {tagCounts.map(({ tag, count, color }) => {
                const pct = total > 0 ? count / total : 0
                if (count === 0) return null
                return (
                  <View key={tag.id} style={styles.barRow}>
                    <View style={[styles.tagDot, { backgroundColor: color }]} />
                    <Text style={styles.barLabel} numberOfLines={1}>{tag.name}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={styles.barCount}>{count}</Text>
                  </View>
                )
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
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
            <Text style={styles.emptySubtext}>
              분석 리포트는 2주마다 받을 수 있어요.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activePeriods.map((period, i) => {
              const count = getPeriodContents(period).length
              const isNewest = i === 0
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.periodCard}
                  onPress={() => setSelectedPeriod(period)}
                  activeOpacity={0.8}
                >
                  <View style={styles.periodCardContent}>
                    <View>
                      <View style={styles.periodLabelRow}>
                        <Text style={styles.periodCardLabel}>{period.label}</Text>
                        {isNewest && (
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
  container: { flex: 1, backgroundColor: Colors.bgMain },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20, gap: 14, paddingBottom: 40 },
  periodCard: {
    backgroundColor: '#2d3052',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  periodCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  periodCardLabel: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  newBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newBadgeText: { fontSize: 11, color: Colors.textPrimary, fontWeight: '700' },
  periodCount: { fontSize: 13, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCardGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  statIcon: { fontSize: 20, color: Colors.textPrimary },
  statNumber: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  statTagName: { fontSize: 12, color: Colors.primaryLight, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  featuredCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  featuredLabel: { fontSize: 13, color: Colors.textTertiary, fontWeight: '500' },
  featuredBody: { fontSize: 16, color: Colors.textPrimary, lineHeight: 26 },
  encourageCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  encourageText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  section: { gap: 10 },
  sectionTitle: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  barLabel: { fontSize: 12, color: Colors.textSecondary, width: 80 },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  barCount: { fontSize: 12, color: Colors.textTertiary, width: 20, textAlign: 'right' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, color: Colors.textSecondary, fontWeight: '500' },
  emptySubtext: { fontSize: 13, color: Colors.textTertiary, textAlign: 'center' },
})