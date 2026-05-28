import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, Alert, Image, ScrollView,
} from 'react-native'
import { useEffect, useState } from 'react'
import { ContentWithTags } from '../types/database'
import { getContentsByTag, getAllContents } from '../api/contents'
import { useTags } from '../hooks/useTags'

const C = {
  bg: '#0d0d1e', card: '#1a1a30', primary: '#7b6ef6',
  text: '#ffffff', textSec: '#8888bb', border: '#252540',
  tagBg: '#1e1e38', tagSel: '#6b5ce7',
}

export default function BrowseScreen({ navigation, route }: any) {
  // ── 로직 영역 ──────────────────────────────────────────────
  const { userId, tagId: initialTagId, recommendationId } = route.params ?? {}
  const { tags } = useTags(userId)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(initialTagId ?? null)
  const [contents, setContents] = useState<ContentWithTags[]>([])
  const [loading, setLoading] = useState(true)

  const load = async (tagId: string | null) => {
    setLoading(true)
    try {
      const data = tagId ? await getContentsByTag(tagId) : await getAllContents()
      setContents(data)
    } catch (e: any) {
      Alert.alert('오류', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(selectedTagId) }, [selectedTagId])
  // ──────────────────────────────────────────────────────────

  const renderCard = ({ item }: { item: ContentWithTags }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => navigation.navigate('ContentDetail', { contentId: item.id, userId })}
      activeOpacity={0.75}
    >
      <View style={s.cardInner}>
        {item.type === 'image' && item.image_url ? (
          <Image source={{ uri: item.image_url }} style={s.cardThumb} />
        ) : (
          <View style={s.cardThumbPlaceholder} />
        )}
        <View style={s.cardText}>
          {item.type === 'text' && (
            <Text style={s.cardBody} numberOfLines={2}>{item.body}</Text>
          )}
          <Text style={s.cardDate}>
            {new Date(item.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>님의 우주</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* 별똥별 배너 */}
      {!!recommendationId && (
        <TouchableOpacity
          style={s.banner}
          onPress={() => navigation.navigate('ShootingStar', { contentId: recommendationId, userId })}
        >
          <Text style={s.bannerText}>＋ 오늘의 별똥별이 도착하였어요.</Text>
          <Text style={s.bannerArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* 태그 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tagScroll}
        contentContainerStyle={s.tagScrollContent}
      >
        <TouchableOpacity
          style={[s.tagChip, selectedTagId === null && s.tagChipActive]}
          onPress={() => setSelectedTagId(null)}
        >
          <Text style={[s.tagChipText, selectedTagId === null && s.tagChipTextActive]}>전체</Text>
        </TouchableOpacity>
        {tags.map(tag => (
          <TouchableOpacity
            key={tag.id}
            style={[s.tagChip, selectedTagId === tag.id && s.tagChipActive]}
            onPress={() => setSelectedTagId(tag.id)}
          >
            <Text style={[s.tagChipText, selectedTagId === tag.id && s.tagChipTextActive]}>
              {tag.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.countText}>전체 {contents.length}</Text>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : contents.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>아직 기록이 없어요.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Create', { userId })}>
            <Text style={s.emptyLink}>첫 별을 기록해보세요 →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={contents}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}
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
  },
  back: { color: C.textSec, fontSize: 22 },
  title: { color: C.text, fontSize: 17, fontWeight: '600' },
  tagScroll: { flexGrow: 0, borderBottomWidth: 1, borderColor: C.border },
  tagScrollContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tagChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: C.tagBg, borderWidth: 1, borderColor: C.border,
  },
  tagChipActive: { backgroundColor: C.tagSel, borderColor: C.tagSel },
  tagChipText: { color: C.textSec, fontSize: 13 },
  tagChipTextActive: { color: C.text, fontWeight: '600' },
  countText: { color: C.textSec, fontSize: 12, paddingHorizontal: 20, paddingVertical: 10 },
  card: {
    backgroundColor: C.card, borderRadius: 14,
    overflow: 'hidden', borderWidth: 1, borderColor: C.border,
  },
  cardInner: { flexDirection: 'row', alignItems: 'center' },
  cardThumb: { width: 72, height: 72, resizeMode: 'cover' },
  cardThumbPlaceholder: { width: 0 },
  cardText: { flex: 1, padding: 14, justifyContent: 'space-between', gap: 6 },
  cardBody: { color: C.text, fontSize: 14, lineHeight: 20 },
  cardDate: { color: C.textSec, fontSize: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: C.textSec, fontSize: 15 },
  emptyLink: { color: C.primary, fontSize: 14 },
  banner: {
    marginHorizontal: 16, marginBottom: 4, borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 12,
    backgroundColor: 'rgba(123,110,246,0.28)', borderWidth: 1, borderColor: C.primary,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  bannerText: { color: '#ffffff', fontSize: 13 },
  bannerArrow: { color: '#8888bb', fontSize: 18 },
})
