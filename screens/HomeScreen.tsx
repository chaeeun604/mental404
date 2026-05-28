import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../hooks/useAuth'
import { useTags } from '../hooks/useTags'
import { getAllContents } from '../api/contents'
import PlanetGraphic from '../components/PlanetGraphic'
import ContentBubble from '../components/ContentBubble'
import GNB from '../components/GNB'
import { Colors } from '../constants/colors'
import type { ScreenProps } from '../types/navigation'
import type { ContentWithTags } from '../types/database'

const { width } = Dimensions.get('window')
const PLANET_SIZE = 220

// Floating bubble positions relative to the planet container (360×340)
// Arranged to surround the planet visually like the Figma design
const BUBBLE_POSITIONS: Array<{ top?: number; bottom?: number; left?: number; right?: number }> = [
  { top: 12,  left: 14 },
  { top: 48,  right: 10 },
  { top: 90,  left: 8 },
  { top: 115, left: 72 },
  { top: 220, left: 12 },
]

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

export default function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const { session } = useAuth()
  const userId = session?.user?.id ?? ''
  const username = session?.user?.email?.split('@')[0] ?? '별님'
  const { tags, loading: tagsLoading } = useTags(userId)
  const [contents, setContents] = useState<ContentWithTags[]>([])
  const [contentsLoading, setContentsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'report' | 'graphic' | 'list'>('graphic')
  const [currentTagIdx, setCurrentTagIdx] = useState(0)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)

  const loadContents = useCallback(() => {
    if (!userId) return
    setContentsLoading(true)
    getAllContents(userId)
      .then(setContents)
      .catch(() => {})
      .finally(() => setContentsLoading(false))
  }, [userId])

  useEffect(() => {
    loadContents()
  }, [])

  const currentTag = tags[currentTagIdx] ?? null

  const tagContents = currentTag
    ? contents.filter((c) => c.content_tags?.some((ct) => ct.tag_id === currentTag.id))
    : []

  const listContents = selectedTagId
    ? contents.filter((c) => c.content_tags?.some((ct) => ct.tag_id === selectedTagId))
    : contents

  const goLeft = () => {
    if (tags.length === 0) return
    setCurrentTagIdx((prev) => (prev - 1 + tags.length) % tags.length)
  }

  const goRight = () => {
    if (tags.length === 0) return
    setCurrentTagIdx((prev) => (prev + 1) % tags.length)
  }

  const renderGraphicView = () => {
    if (tagsLoading || contentsLoading) {
      return (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )
    }

    if (tags.length === 0) {
      return (
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyText}>+ 버튼으로 첫 번째{'\n'}별을 기록해보세요.</Text>
        </View>
      )
    }

    const shownCards = tagContents.slice(0, 5)
    const overflowCount = tagContents.length - 5

    return (
      <View style={styles.graphicArea}>
        {/* Planet container — planet centered, bubbles float around it */}
        <View style={styles.planetContainer}>
          {/* Centered planet */}
          <View style={styles.planetCenter}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                if (tagContents.length > 0) {
                  navigation.navigate('ContentDetail', { contentId: tagContents[0].id })
                }
              }}
            >
              <PlanetGraphic tagIndex={currentTagIdx} size={PLANET_SIZE} />
            </TouchableOpacity>
          </View>

          {/* Floating content bubbles */}
          {shownCards.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.bubble, BUBBLE_POSITIONS[idx]]}
              onPress={() => navigation.navigate('ContentDetail', { contentId: item.id })}
              activeOpacity={0.8}
            >
              <ContentBubble item={item} />
            </TouchableOpacity>
          ))}

          {/* Overflow badge */}
          {overflowCount > 0 && (
            <TouchableOpacity
              style={styles.overflowBadge}
              onPress={() => {
                setSelectedTagId(currentTag?.id ?? null)
                setActiveTab('list')
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#3B21FB', '#AEF1FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.overflowGradient}
              >
                <Text style={styles.overflowText}>+{overflowCount}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Arrow navigation */}
        <View style={styles.arrowRow}>
          <TouchableOpacity style={styles.arrowBtn} onPress={goLeft}>
            <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.arrowLabel}>{currentTag?.name ?? ''}</Text>
          <TouchableOpacity style={styles.arrowBtn} onPress={goRight}>
            <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderListView = () => (
    <View style={styles.flex}>
      {/* Tag filter chips — no "전체" chip */}
      <View style={styles.listHeader}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagChipsRow}
        >
          {tags.map((tag) => {
            const isActive = selectedTagId === tag.id
            return (
              <TouchableOpacity
                key={tag.id}
                style={[styles.tagChip, isActive && styles.tagChipActive]}
                onPress={() => setSelectedTagId(isActive ? null : tag.id)}
              >
                <Text style={[styles.tagChipText, isActive && styles.tagChipTextActive]}>
                  {tag.name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
        <Text style={styles.totalCount}>전체 {listContents.length}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {contentsLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : listContents.length === 0 ? (
          <Text style={styles.emptyText}>아직 기록이 없어요.</Text>
        ) : (
          listContents.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.listCard}
              onPress={() => navigation.navigate('ContentDetail', { contentId: item.id })}
              activeOpacity={0.8}
            >
              {item.type === 'image' && item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.listThumbnail} />
              ) : null}
              <View style={styles.listCardText}>
                <Text style={styles.listBody} numberOfLines={2}>
                  {item.type === 'text' && item.body
                    ? truncate(item.body, 64)
                    : '이미지'}
                </Text>
                <View style={styles.listDateRow}>
                  <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
                  <Text style={styles.listDate}>
                    {new Date(item.created_at).toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  )

  return (
    <View style={styles.flex}>
      <LinearGradient colors={Colors.bgHomeGradient} style={styles.flex}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header — title centered, profile icon right */}
          <View style={styles.header}>
            <View style={{ width: 36 }} />
            <Text style={styles.headerTitle}>{username}님의 우주</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('MyPage')}
              style={styles.profileBtn}
            >
              <Ionicons name="person-circle-outline" size={32} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Daily star banner */}
          <TouchableOpacity
            style={styles.banner}
            onPress={() => navigation.navigate('ShootingStar')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#3B21FB', '#AEF1FF']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.bannerGradient}
            >
              <Text style={styles.bannerText}>✦ 오늘의 별똥별이 도착했어요.</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textPrimary} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Content area */}
          <View style={styles.flex}>
            {activeTab === 'graphic' ? renderGraphicView() : renderListView()}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <GNB
        activeTab={activeTab === 'report' ? 'report' : activeTab}
        onReport={() => navigation.navigate('Report')}
        onGraphic={() => setActiveTab('graphic')}
        onList={() => setActiveTab('list')}
        onCreate={() => navigation.navigate('Create')}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    height: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  profileBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  banner: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 11,
    overflow: 'hidden',
  },
  bannerGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  bannerText: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingTop: 40,
  },
  graphicArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
    gap: 20,
  },
  planetContainer: {
    width: 360,
    height: 320,
    position: 'relative',
  },
  planetCenter: {
    position: 'absolute',
    top: (320 - PLANET_SIZE) / 2,
    left: (360 - PLANET_SIZE) / 2,
  },
  bubble: {
    position: 'absolute',
  },
  overflowBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  overflowGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    fontSize: 14,
    color: '#fbfcfe',
    fontFamily: 'Pretendard-SemiBold',
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  arrowBtn: { padding: 8 },
  arrowLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
    minWidth: 130,
    textAlign: 'center',
  },
  listHeader: { paddingTop: 4 },
  tagChipsRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagChip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  tagChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tagChipText: { fontSize: 13, color: Colors.textSecondary },
  tagChipTextActive: { color: Colors.textPrimary, fontWeight: '600' },
  totalCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  listCard: {
    height: 80,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  listThumbnail: { width: 80, height: 80 },
  listCardText: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  listBody: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  listDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listDate: { fontSize: 12, color: '#9A9FB3' },
})