import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import { useEffect, useState } from 'react'
import { generatePeriods, getEarliestDate, BiweeklyPeriod } from '../api/reports'

const C = {
  bg: '#0d0d1e', card: '#1a1a30', primary: '#7b6ef6',
  text: '#ffffff', textSec: '#8888bb', border: '#252540', new: '#4ade80',
}

export default function ReportScreen({ navigation, route }: any) {
  // ── 로직 영역 ──────────────────────────────────────────────
  const { userId } = route.params
  const [periods, setPeriods] = useState<BiweeklyPeriod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const earliest = await getEarliestDate(userId)
        if (earliest) setPeriods(generatePeriods(earliest))
      } catch (e: any) {
        Alert.alert('오류', e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])
  // ──────────────────────────────────────────────────────────

  const renderPeriod = ({ item }: { item: BiweeklyPeriod }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => navigation.navigate('ReportDetail', { userId, period: {
        label: item.label,
        start: item.start.toISOString(),
        end: item.end.toISOString(),
      }})}
      activeOpacity={0.75}
    >
      <View style={s.cardRow}>
        <View>
          <Text style={s.cardLabel}>{item.label}</Text>
          <Text style={s.cardSub}>
            {item.start.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} –{' '}
            {item.end.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
          </Text>
        </View>
        {item.isNew && (
          <View style={s.newBadge}>
            <Text style={s.newBadgeText}>New</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>분석 리포트</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : periods.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📦</Text>
          <Text style={s.emptyTitle}>아직 리포트가 없어요</Text>
          <Text style={s.emptyDesc}>분석 리포트는 2주마다 받을 수 있어요.</Text>
        </View>
      ) : (
        <FlatList
          data={periods}
          keyExtractor={item => item.label}
          renderItem={renderPeriod}
          contentContainerStyle={{ padding: 16, gap: 10 }}
        />
      )}

    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16,
    borderBottomWidth: 1, borderColor: C.border,
  },
  back: { color: C.textSec, fontSize: 22 },
  title: { color: C.text, fontSize: 17, fontWeight: '600' },
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: C.border,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: C.text, fontSize: 15, fontWeight: '600', marginBottom: 4 },
  cardSub: { color: C.textSec, fontSize: 12 },
  newBadge: {
    backgroundColor: C.new, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3,
  },
  newBadgeText: { color: '#000', fontSize: 12, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { color: C.text, fontSize: 17, fontWeight: '600' },
  emptyDesc: { color: C.textSec, fontSize: 13 },
})
