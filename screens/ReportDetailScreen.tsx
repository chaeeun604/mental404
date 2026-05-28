import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, Image,
} from 'react-native'
import { useEffect, useState } from 'react'
import { getPeriodStats, PeriodStats } from '../api/reports'

const C = {
  bg: '#0d0d1e', card: '#1a1a30', card2: '#12122a', primary: '#7b6ef6',
  text: '#ffffff', textSec: '#8888bb', border: '#252540',
}

const TAG_COLORS = ['#6b5ce7', '#a78bfa', '#3b82f6', '#34d399', '#f59e0b', '#f87171', '#06b6d4', '#c084fc']

export default function ReportDetailScreen({ navigation, route }: any) {
  // ── 로직 영역 ──────────────────────────────────────────────
  const { userId, period } = route.params
  const [stats, setStats] = useState<PeriodStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const data = await getPeriodStats(userId, new Date(period.start), new Date(period.end))
        setStats(data)
      } catch (e: any) {
        Alert.alert('오류', e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const tagColors: Record<string, string> = {}
  stats?.tagDistribution.forEach((tag, i) => {
    tagColors[tag.name] = TAG_COLORS[i % TAG_COLORS.length]
  })

  const maxDay  = Math.max(...(stats?.dayDistribution.map(d => d.count) ?? [1]), 1)
  const maxTime = Math.max(...(stats?.timeDistribution.map(t => t.count) ?? [1]), 1)
  // ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={C.primary} />
      </View>
    )
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* 헤더 */}
      <View style={s.header}>
        <Text style={s.title}>{period.label}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.closeBtn}>×</Text>
        </TouchableOpacity>
      </View>

      {/* 요약 카드 */}
      <View style={s.summaryRow}>
        <View style={[s.summaryCard, s.summaryCardPrimary]}>
          <Text style={s.summaryNum}>+{stats?.totalSaved ?? 0}</Text>
          <Text style={s.summaryLabelLight}>저장한 별의 개수</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={s.summaryEmoji}>{stats?.topTag?.emoji ?? '—'}</Text>
          <Text style={s.summaryTagName} numberOfLines={2}>{stats?.topTag?.name ?? ''}</Text>
          <Text style={s.summaryLabel}>가장 자주 꺼내본 태그</Text>
        </View>
      </View>

      {/* 가장 많이 꺼내본 별 */}
      {stats?.mostViewedContent && (
        <>
          <Text style={s.sectionTitle}>가장 많이 꺼내본 별</Text>
          <View style={s.contentCard}>
            {stats.mostViewedContent.type === 'image' && stats.mostViewedContent.image_url ? (
              <Image source={{ uri: stats.mostViewedContent.image_url }} style={s.contentImage} />
            ) : (
              <Text style={s.contentBody} numberOfLines={3}>{stats.mostViewedContent.body}</Text>
            )}
          </View>
        </>
      )}

      {/* 위로 메시지 */}
      {(stats?.totalViews ?? 0) > 0 && (
        <View style={s.messageCard}>
          <Text style={s.messageText}>
            {`이번 2주는 ${stats?.topTag ? `${stats.topTag.name}의 별을 가장 많이 꺼내봤고,\n` : ''}${stats!.totalViews}번이나 스스로를 위로해냈어요!`}
          </Text>
        </View>
      )}

      {/* 태그 분포 */}
      {(stats?.tagDistribution.length ?? 0) > 0 && (
        <View style={s.card}>
          {/* 비율 막대 */}
          <View style={s.proportionBar}>
            {stats!.tagDistribution.map((tag, i) => {
              const isFirst = i === 0
              const isLast = i === stats!.tagDistribution.length - 1
              return (
                <View
                  key={tag.name}
                  style={[
                    s.proportionSegment,
                    {
                      flex: tag.count,
                      backgroundColor: tagColors[tag.name],
                      borderTopLeftRadius: isFirst ? 6 : 0,
                      borderBottomLeftRadius: isFirst ? 6 : 0,
                      borderTopRightRadius: isLast ? 6 : 0,
                      borderBottomRightRadius: isLast ? 6 : 0,
                    },
                  ]}
                />
              )
            })}
          </View>
          {/* 2열 태그 목록 */}
          <View style={s.tagLegendGrid}>
            {stats!.tagDistribution.map(tag => (
              <View key={tag.name} style={s.tagLegendItem}>
                <View style={[s.tagDot, { backgroundColor: tagColors[tag.name] }]} />
                <Text style={s.tagLegendText} numberOfLines={1}>
                  {tag.name}{' '}
                  <Text style={s.tagLegendCount}>{tag.count}번</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 피크 레이블 */}
      {stats?.peakLabel && (
        <View style={s.peakCard}>
          <Text style={s.peakText}>{stats.peakLabel},</Text>
          <Text style={s.peakText}>별을 가장 자주 꺼내봤어요.</Text>
        </View>
      )}

      {/* 요일 분포 — 태그 범례 칩 + 막대 차트 */}
      <View style={s.dayLegendRow}>
        <View style={[s.dayChip, s.dayChipActive]}>
          <Text style={s.dayChipActiveText}>전체</Text>
        </View>
        {stats?.tagDistribution.map(tag => (
          <View key={tag.name} style={s.dayChip}>
            <View style={[s.chipDot, { backgroundColor: tagColors[tag.name] }]} />
            <Text style={s.dayChipText} numberOfLines={1}>{tag.name}</Text>
          </View>
        ))}
      </View>
      <View style={s.card}>
        <View style={s.dayChart}>
          {stats?.dayDistribution.map(item => (
            <View key={item.day} style={s.dayCol}>
              {item.count > 0 && <Text style={s.dayCount}>{item.count}</Text>}
              <View style={[s.dayBar, { height: Math.max(4, Math.round((item.count / maxDay) * 72)) }]} />
              <Text style={s.dayLabel}>{item.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 시간대 분포 */}
      <View style={s.card}>
        {stats?.timeDistribution.map(item => (
          <View key={item.label} style={s.timeRow}>
            <Text style={s.timeLabel}>{item.label}</Text>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${Math.round((item.count / maxTime) * 100)}%` }]} />
            </View>
            <Text style={s.barCount}>{item.count}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24, paddingTop: 8,
  },
  title: { color: C.text, fontSize: 16, fontWeight: '600' },
  closeBtn: { color: C.textSec, fontSize: 28 },

  // 요약 카드
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 16,
    alignItems: 'flex-start', borderWidth: 1, borderColor: C.border,
  },
  summaryCardPrimary: { backgroundColor: C.primary, borderColor: C.primary },
  summaryNum: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 4 },
  summaryLabelLight: { color: 'rgba(255,255,255,0.75)', fontSize: 11 },
  summaryEmoji: { fontSize: 26, marginBottom: 6 },
  summaryTagName: { color: C.text, fontSize: 13, fontWeight: '600', marginBottom: 2, lineHeight: 18 },
  summaryLabel: { color: C.textSec, fontSize: 11 },

  sectionTitle: { color: C.text, fontSize: 14, fontWeight: '600', marginBottom: 10, marginTop: 4 },
  contentCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: C.border,
  },
  contentImage: { width: '100%', height: 160, borderRadius: 10, resizeMode: 'cover' },
  contentBody: { color: C.text, fontSize: 15, lineHeight: 24 },

  // 위로 메시지
  messageCard: {
    backgroundColor: '#1c1444', borderRadius: 14, padding: 18,
    marginBottom: 20, borderWidth: 1, borderColor: C.primary,
  },
  messageText: { color: C.text, fontSize: 14, lineHeight: 24 },

  // 공통 카드
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    marginBottom: 20, borderWidth: 1, borderColor: C.border,
  },

  // 비율 막대
  proportionBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16, gap: 2 },
  proportionSegment: { height: '100%' },

  // 태그 범례
  tagLegendGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, columnGap: 8 },
  tagLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '47%' },
  tagDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  tagLegendText: { color: C.text, fontSize: 12, flex: 1 },
  tagLegendCount: { color: C.textSec },

  // 피크 카드
  peakCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 18,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
  },
  peakText: { color: C.text, fontSize: 16, fontWeight: '600', lineHeight: 26 },

  // 요일 범례 칩
  dayLegendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  dayChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    maxWidth: 120,
  },
  dayChipActive: { backgroundColor: C.text, borderColor: C.text },
  dayChipActiveText: { color: C.bg, fontSize: 12, fontWeight: '600' },
  dayChipText: { color: C.textSec, fontSize: 12 },
  chipDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },

  // 요일 차트
  dayChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 100 },
  dayCol: { alignItems: 'center', gap: 4 },
  dayCount: { color: C.textSec, fontSize: 10 },
  dayBar: { width: 24, backgroundColor: C.primary, borderRadius: 4, minHeight: 4 },
  dayLabel: { color: C.textSec, fontSize: 11 },

  // 시간대
  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  timeLabel: { color: C.text, fontSize: 12, width: 34 },
  barTrack: { flex: 1, height: 8, backgroundColor: C.card2, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: C.primary, borderRadius: 4 },
  barCount: { color: C.textSec, fontSize: 11, width: 22, textAlign: 'right' },
})
